import { runBankersSafetyAlgorithm } from '../algorithms/bankersSafety';
import {
  runDeadlockDetection,
  terminateProcessAndRecover,
} from '../algorithms/deadlockDetection';
import { evaluateResourceOrderingRequest } from '../algorithms/deadlockPrevention';
import { evaluateResourceRequest } from '../algorithms/resourceRequest';
import { calculateNeedMatrix, validateSystemState } from '../algorithms/validation';
import {
  CLASSIC_SAFE_SCENARIO,
  DEDICATED_DEADLOCK_SCENARIO,
  DEFAULT_RESOURCE_ORDERING,
} from '../data/scenarios';
import type { TestCaseResult } from '../types';

export interface TestExecutionDetails {
  id: string;
  name: string;
  category: string;
  description: string;
  run: () => TestCaseResult;
}

/**
 * TC1: Safe State and Need Calculation Verification
 */
export function runTC1(): TestCaseResult {
  const startTime = performance.now();
  const state = CLASSIC_SAFE_SCENARIO;

  // 1. Calculate Need
  const need = calculateNeedMatrix(state.maximum, state.allocation);
  const expectedNeedP0 = [7, 4, 3];
  const expectedNeedP1 = [1, 2, 2];
  const expectedNeedP2 = [6, 0, 0];
  const expectedNeedP3 = [0, 1, 1];
  const expectedNeedP4 = [4, 3, 1];

  const needCalculatedCorrectly =
    JSON.stringify(need[0]) === JSON.stringify(expectedNeedP0) &&
    JSON.stringify(need[1]) === JSON.stringify(expectedNeedP1) &&
    JSON.stringify(need[2]) === JSON.stringify(expectedNeedP2) &&
    JSON.stringify(need[3]) === JSON.stringify(expectedNeedP3) &&
    JSON.stringify(need[4]) === JSON.stringify(expectedNeedP4);

  // 2. Run Banker's Safety
  const result = runBankersSafetyAlgorithm(state);
  const isSafe = result.isSafe;
  const sequence = result.safeSequence;
  const hasValidLength = sequence.length === 5;

  const passed = needCalculatedCorrectly && isSafe && hasValidLength;
  const elapsed = Math.round(performance.now() - startTime);

  return {
    id: 'TC1',
    name: 'Safe State & Need Calculation',
    category: "Banker's Algorithm",
    description: 'Verify accurate Need matrix deduction (Need = Max - Alloc) and discovery of a valid safe execution sequence.',
    initialStateSummary: 'Processes: P0-P4, Available: [3, 3, 2], Classic textbook matrices',
    inputAction: 'Execute runBankersSafetyAlgorithm (Classic Safe Scenario)',
    computedResult: `Safe=${isSafe}, Sequence=<${sequence.join(' -> ')}>, Need[P0]=[${need[0].join(',')}], Need[P1]=[${need[1].join(',')}]`,
    expectedResult: 'Safe=true, 5-process complete sequence (starting with P1 or P3), verified Need matrix',
    passed,
    explanation: passed
      ? `TC1 PASSED: Need correctly evaluated for all processes. Safe sequence <${sequence.join(' -> ')}> mathematically satisfies all process demands sequentially without deadlock.`
      : `TC1 FAILED: Unexpected computation result. NeedMatch=${needCalculatedCorrectly}, Safe=${isSafe}`,
    status: passed ? 'PASSED' : 'FAILED',
    executionTimeMs: elapsed,
  };
}

/**
 * TC2: Request Exceeds Available Resources
 */
export function runTC2(): TestCaseResult {
  const startTime = performance.now();
  const state = CLASSIC_SAFE_SCENARIO;

  // Process P1 needs [1, 2, 2].
  // Available is [3, 3, 2].
  // If P1 requests [1, 4, 0]: it does NOT exceed maximum claim [3, 2, 2], but wait,
  // Let's pick a request that is WITHIN Need, but EXCEEDS Available:
  // For P0: Need is [7, 4, 3]. Available is [3, 3, 2].
  // P0 requests [4, 1, 0]:
  // 4 <= 7 (within Need A), 1 <= 4 (within Need B), 0 <= 3 (within Need C).
  // But Available A is 3, so requested 4 > Available 3!
  const pIndex = 0; // P0
  const requestVector = [4, 1, 0];
  const origAvailable = [...state.available];

  const evalResult = evaluateResourceRequest(state, pIndex, requestVector);

  const correctDecision = evalResult.decision === 'EXCEEDS_AVAILABLE';
  const statePreserved = JSON.stringify(evalResult.finalState.available) === JSON.stringify(origAvailable);
  const passed = correctDecision && statePreserved && !evalResult.availableCheckPassed && evalResult.needCheckPassed;
  const elapsed = Math.round(performance.now() - startTime);

  return {
    id: 'TC2',
    name: 'Request Exceeds Available (Wait State)',
    category: 'Resource Request Simulator',
    description: 'Verify that a request within process Need but exceeding currently Available resources is NOT granted and preserves system state.',
    initialStateSummary: 'P0 Need=[7, 4, 3], Available=[3, 3, 2]',
    inputAction: 'P0 requests [4, 1, 0] (Req A=4 > Avail A=3)',
    computedResult: `Decision=${evalResult.decision}, AvailableCheck=${evalResult.availableCheckPassed}, AvailablePreserved=${statePreserved}`,
    expectedResult: 'Decision=EXCEEDS_AVAILABLE, AvailableCheck=false, State preserved exactly unchanged',
    passed,
    explanation: passed
      ? 'TC2 PASSED: Check A passed (Request <= Need), Check B failed (Request > Available). Request placed in WAITING status, system state remained 100% untouched.'
      : `TC2 FAILED: Expected EXCEEDS_AVAILABLE with unchanged state, got ${evalResult.decision}`,
    status: passed ? 'PASSED' : 'FAILED',
    executionTimeMs: elapsed,
  };
}

/**
 * TC3: Unsafe Request with Exact Rollback
 */
export function runTC3(): TestCaseResult {
  const startTime = performance.now();
  const state = CLASSIC_SAFE_SCENARIO;

  // Classic textbook example: P4 requests [3, 3, 0].
  // P4 Need is [4, 3, 1]. Request [3, 3, 0] <= Need [4, 3, 1] -> Check A PASSES!
  // Available is [3, 3, 2]. Request [3, 3, 0] <= Available [3, 3, 2] -> Check B PASSES!
  // Temporary simulation:
  // Available becomes [0, 0, 2].
  // Allocation P4 becomes [3, 3, 2].
  // Need P4 becomes [1, 0, 1].
  // Running Banker's Safety:
  // Work = [0, 0, 2].
  // Check P0: Need [7,4,3] <= [0,0,2]? No.
  // Check P1: Need [1,2,2] <= [0,0,2]? No.
  // Check P2: Need [6,0,0] <= [0,0,2]? No.
  // Check P3: Need [0,1,1] <= [0,0,2]? No.
  // Check P4: Need [1,0,1] <= [0,0,2]? No.
  // NO PROCESS CAN EXECUTE! State is completely UNSAFE!
  // Must reject request and roll back state exactly!
  const pIndex = 4; // P4
  const requestVector = [3, 3, 0];
  const origAvailable = [...state.available];
  const origAllocP4 = [...state.allocation[4]];

  const evalResult = evaluateResourceRequest(state, pIndex, requestVector);

  const deniedUnsafe = evalResult.decision === 'UNSAFE_DENIED';
  const safetyCheckFailed = !evalResult.safetyCheckPassed;
  const availableRestored = JSON.stringify(evalResult.finalState.available) === JSON.stringify(origAvailable);
  const allocRestored = JSON.stringify(evalResult.finalState.allocation[4]) === JSON.stringify(origAllocP4);

  const passed = deniedUnsafe && safetyCheckFailed && availableRestored && allocRestored;
  const elapsed = Math.round(performance.now() - startTime);

  return {
    id: 'TC3',
    name: 'Unsafe Request & Rollback',
    category: 'Resource Request Simulator',
    description: 'Verify classic Silberschatz edge case: P4 requests [3, 3, 0]. Checks A & B pass, simulated state is unsafe, request is rejected and state is rolled back.',
    initialStateSummary: 'P4 Need=[4, 3, 1], Available=[3, 3, 2]',
    inputAction: 'P4 requests [3, 3, 0]',
    computedResult: `Decision=${evalResult.decision}, SafetyPass=${evalResult.safetyCheckPassed}, StateRestored=${availableRestored && allocRestored}`,
    expectedResult: 'Decision=UNSAFE_DENIED, SafetyPass=false, Exact rollback to original Available=[3, 3, 2]',
    passed,
    explanation: passed
      ? 'TC3 PASSED: Checks A and B passed, but safety check D identified an unsafe state with zero proceedable processes. Request was DENIED and state was rolled back with zero mutation.'
      : `TC3 FAILED: Expected UNSAFE_DENIED with full rollback. Result: ${evalResult.decision}`,
    status: passed ? 'PASSED' : 'FAILED',
    executionTimeMs: elapsed,
  };
}

/**
 * TC4: Deadlock Detection & Interactive Recovery
 */
export function runTC4(): TestCaseResult {
  const startTime = performance.now();
  const state = DEDICATED_DEADLOCK_SCENARIO;

  // 1. Initial detection: P0 finishes, P1-P4 are in circular deadlock
  const initialDetection = runDeadlockDetection(state);
  const detectedDeadlock = initialDetection.isDeadlocked;
  const deadlockedCount = initialDetection.deadlockedProcessIds.length;

  // 2. Terminate P2 to recover
  const p2Index = 2;
  const recovery = terminateProcessAndRecover(state, p2Index);
  const recoveredDeadlockFree = !recovery.detectionAfterRecovery.isDeadlocked;

  const passed = detectedDeadlock && deadlockedCount === 4 && recoveredDeadlockFree;
  const elapsed = Math.round(performance.now() - startTime);

  return {
    id: 'TC4',
    name: 'Deadlock Detection & Recovery',
    category: 'Deadlock Detection',
    description: 'Verify multiple-instance detection algorithm flags circular waiting processes and that terminating P2 successfully breaks the cycle and clears deadlock.',
    initialStateSummary: '5 processes, A=7, B=2, C=6, Available=[0, 0, 0]',
    inputAction: 'Run detection algorithm; then terminate P2 (releases [3, 0, 3]) and rerun detection',
    computedResult: `InitialDeadlocked=${detectedDeadlock} (${initialDetection.deadlockedProcessIds.join(', ')}), PostRecoveryDeadlocked=${recovery.detectionAfterRecovery.isDeadlocked}`,
    expectedResult: 'Initial: Deadlocked processes {P1, P2, P3, P4}; Post-Recovery: isDeadlocked=false (all remaining processes finish)',
    passed,
    explanation: passed
      ? 'TC4 PASSED: Multiple-instance detection properly identified deadlocked set {P1, P2, P3, P4}. Terminating P2 reclaimed [3, 0, 3] resources, allowing P3, P4, and P1 to finish sequentially.'
      : `TC4 FAILED: Deadlock detection or recovery did not match expected mathematical outcome.`,
    status: passed ? 'PASSED' : 'FAILED',
    executionTimeMs: elapsed,
  };
}

/**
 * TC5: Deadlock Prevention via Resource Ordering Policy
 */
export function runTC5(): TestCaseResult {
  const startTime = performance.now();
  const ordering = DEFAULT_RESOURCE_ORDERING; // R0=1, R1=2, R2=3
  const allResources = [
    { id: 'R0', name: 'Disk (R0)', totalInstances: 2 },
    { id: 'R1', name: 'Memory (R1)', totalInstances: 2 },
    { id: 'R2', name: 'Printer (R2)', totalInstances: 2 },
  ];

  // Test 1: Process holds R0 (Rank 1), requests R2 (Rank 3) -> Should PASS (3 > 1)
  const forwardReq = evaluateResourceOrderingRequest(ordering, allResources, ['R0'], 'R2');

  // Test 2: Process holds R2 (Rank 3), requests R0 (Rank 1) -> Should BE REJECTED (1 <= 3)
  const backwardReq = evaluateResourceOrderingRequest(ordering, allResources, ['R2'], 'R0');

  const passed = forwardReq.isAllowed && !backwardReq.isAllowed;
  const elapsed = Math.round(performance.now() - startTime);

  return {
    id: 'TC5',
    name: 'Deadlock Prevention via Total Ordering',
    category: 'Deadlock Prevention',
    description: 'Verify Havender hierarchical ordering policy (F: R -> N): forward requests (F(R_j) > F(R_i)) are allowed; reverse requests causing circular wait are rejected.',
    initialStateSummary: 'Ordering: Disk(R0)=1, Memory(R1)=2, Printer(R2)=3',
    inputAction: 'Test A: Hold R0, request R2. Test B: Hold R2, request R0.',
    computedResult: `ForwardRequest=${forwardReq.isAllowed ? 'ALLOWED' : 'DENIED'}, ReverseRequest=${backwardReq.isAllowed ? 'ALLOWED' : 'REJECTED'}`,
    expectedResult: 'ForwardRequest=ALLOWED (3 > 1), ReverseRequest=REJECTED (1 <= 3, circular wait broken)',
    passed,
    explanation: passed
      ? 'TC5 PASSED: Strict hierarchical ordering validated. By enforcing monotonic ordering on resource acquisition, circular wait cycles are mathematically proven to be prevented.'
      : 'TC5 FAILED: Resource ordering policy did not evaluate request hierarchy correctly.',
    status: passed ? 'PASSED' : 'FAILED',
    executionTimeMs: elapsed,
  };
}

/**
 * TC6: Boundary Conditions and Input Validation
 */
export function runTC6(): TestCaseResult {
  const startTime = performance.now();

  // Test various edge and invalid conditions:
  // 1. Allocation exceeding Maximum
  const invalidAllocState = {
    processes: [{ id: 'P0', name: 'P0' }],
    resources: [{ id: 'R0', name: 'A', totalInstances: 5 }],
    allocation: [[6]], // 6 > 5
    maximum: [[5]],
    available: [0],
  };
  const valResult1 = validateSystemState(invalidAllocState);

  // 2. Negative Available value
  const negativeAvailState = {
    processes: [{ id: 'P0', name: 'P0' }],
    resources: [{ id: 'R0', name: 'A', totalInstances: 5 }],
    allocation: [[2]],
    maximum: [[4]],
    available: [-1], // negative!
  };
  const valResult2 = validateSystemState(negativeAvailState);

  // 3. Dimension mismatch (rows != processCount)
  const mismatchDimState = {
    processes: [{ id: 'P0', name: 'P0' }, { id: 'P1', name: 'P1' }],
    resources: [{ id: 'R0', name: 'A', totalInstances: 5 }],
    allocation: [[1]], // only 1 row, expected 2!
    maximum: [[2], [2]],
    available: [2],
  };
  const valResult3 = validateSystemState(mismatchDimState);

  // 4. Request exceeding Need
  const p0ReqExcessNeed = evaluateResourceRequest(CLASSIC_SAFE_SCENARIO, 0, [8, 0, 0]); // Need A is 7

  const caughtAllocOverMax = !valResult1.isValid && valResult1.errors.some((e) => e.includes('exceeds Maximum'));
  const caughtNegative = !valResult2.isValid && valResult2.errors.some((e) => e.includes('negative'));
  const caughtDimension = !valResult3.isValid && valResult3.errors.some((e) => e.includes('mismatch'));
  const caughtExcessNeed = p0ReqExcessNeed.decision === 'EXCEEDS_NEED';

  const passed = caughtAllocOverMax && caughtNegative && caughtDimension && caughtExcessNeed;
  const elapsed = Math.round(performance.now() - startTime);

  return {
    id: 'TC6',
    name: 'Boundary Conditions & Input Validation',
    category: 'System Validation',
    description: 'Verify robust detection of invalid inputs: Allocation > Maximum, negative vectors, matrix dimension mismatches, and request > declared Need.',
    initialStateSummary: 'Boundary test matrices with synthetic invalid values',
    inputAction: 'Run validateSystemState on corrupted matrices and test request > Need',
    computedResult: `Alloc>Max Caught=${caughtAllocOverMax}, Negative Caught=${caughtNegative}, DimMismatch Caught=${caughtDimension}, NeedOverflow Caught=${caughtExcessNeed}`,
    expectedResult: 'All 4 invalid conditions identified and rejected with descriptive error messages without crashing',
    passed,
    explanation: passed
      ? 'TC6 PASSED: All boundary and corrupted state checks successfully intercepted. Safe boundaries prevent invalid states from ever executing in the core algorithms.'
      : 'TC6 FAILED: One or more validation checks failed to catch an illegal configuration.',
    status: passed ? 'PASSED' : 'FAILED',
    executionTimeMs: elapsed,
  };
}

export const ALL_TEST_CASES: TestExecutionDetails[] = [
  {
    id: 'TC1',
    name: 'Safe State & Need Calculation',
    category: "Banker's Algorithm",
    description: 'Verify accurate Need matrix deduction and discovery of a valid safe execution sequence.',
    run: runTC1,
  },
  {
    id: 'TC2',
    name: 'Request Exceeds Available (Wait State)',
    category: 'Resource Request Simulator',
    description: 'Verify that a request within process Need but exceeding currently Available resources is NOT granted and preserves system state.',
    run: runTC2,
  },
  {
    id: 'TC3',
    name: 'Unsafe Request & Rollback',
    category: 'Resource Request Simulator',
    description: 'Verify classic Silberschatz edge case: P4 requests [3, 3, 0]. Checks A & B pass, simulated state is unsafe, request is denied and rolled back.',
    run: runTC3,
  },
  {
    id: 'TC4',
    name: 'Deadlock Detection & Recovery',
    category: 'Deadlock Detection',
    description: 'Verify multiple-instance detection algorithm flags circular waiting processes and that terminating P2 successfully breaks the cycle and clears deadlock.',
    run: runTC4,
  },
  {
    id: 'TC5',
    name: 'Deadlock Prevention via Total Ordering',
    category: 'Deadlock Prevention',
    description: 'Verify Havender hierarchical ordering policy: forward requests allowed; reverse requests causing circular wait are rejected.',
    run: runTC5,
  },
  {
    id: 'TC6',
    name: 'Boundary Conditions & Input Validation',
    category: 'System Validation',
    description: 'Verify robust detection of invalid inputs: Allocation > Maximum, negative vectors, matrix dimension mismatches, and request > Need.',
    run: runTC6,
  },
];
