import type { RequestEvaluationResult, RequestTransaction, SystemState } from '../types';
import { runBankersSafetyAlgorithm } from './bankersSafety';
import { calculateNeedMatrix } from './validation';

/**
 * Deep clones a SystemState object to ensure immutability during simulation.
 */
export function cloneSystemState(state: SystemState): SystemState {
  return {
    ...state,
    processes: state.processes.map((p) => ({ ...p })),
    resources: state.resources.map((r) => ({ ...r })),
    allocation: state.allocation.map((row) => [...row]),
    maximum: state.maximum.map((row) => [...row]),
    available: [...state.available],
    need: state.need ? state.need.map((row) => [...row]) : calculateNeedMatrix(state.maximum, state.allocation),
  };
}

/**
 * Evaluates a resource request using Dijkstra's Resource Request Algorithm.
 * Strictly executes checks A -> B -> C -> D -> E / F.
 */
export function evaluateResourceRequest(
  currentState: SystemState,
  processIndex: number,
  requestVector: number[]
): RequestEvaluationResult {
  const pCount = currentState.processes.length;
  const rCount = currentState.resources.length;

  if (processIndex < 0 || processIndex >= pCount) {
    return {
      decision: 'EXCEEDS_NEED',
      reason: `Invalid process index: ${processIndex}. Process does not exist.`,
      needCheckPassed: false,
      availableCheckPassed: false,
      safetyCheckPassed: false,
      finalState: cloneSystemState(currentState),
    };
  }

  const process = currentState.processes[processIndex];
  const need = currentState.need || calculateNeedMatrix(currentState.maximum, currentState.allocation);
  const processNeed = need[processIndex];
  const resourceNames = currentState.resources.map((r) => r.name);

  // CHECK A: Request <= Need ?
  for (let j = 0; j < rCount; j++) {
    const requested = requestVector[j] ?? 0;
    const maxNeeded = processNeed[j] ?? 0;
    if (requested > maxNeeded) {
      const resName = resourceNames[j] || `R${j}`;
      return {
        decision: 'EXCEEDS_NEED',
        reason: `INVALID REQUEST (Check A Failed): Process ${process.name} requested ${requested} instances of ${resName}, but its declared remaining Need is only ${maxNeeded}. A process can never claim more than its declared maximum.`,
        needCheckPassed: false,
        availableCheckPassed: false,
        safetyCheckPassed: false,
        finalState: cloneSystemState(currentState),
      };
    }
  }

  // CHECK B: Request <= Available ?
  for (let j = 0; j < rCount; j++) {
    const requested = requestVector[j] ?? 0;
    const avail = currentState.available[j] ?? 0;
    if (requested > avail) {
      const resName = resourceNames[j] || `R${j}`;
      return {
        decision: 'EXCEEDS_AVAILABLE',
        reason: `REQUEST WAITING (Check B Failed): Process ${process.name} requested ${requested} instances of ${resName}, but only ${avail} are currently Available in the system. The process must wait for resources to become available. System state is preserved without changes.`,
        needCheckPassed: true,
        availableCheckPassed: false,
        safetyCheckPassed: false,
        finalState: cloneSystemState(currentState),
      };
    }
  }

  // CHECK C: Temporarily simulate allocation
  const simulatedState = cloneSystemState(currentState);

  for (let j = 0; j < rCount; j++) {
    const req = requestVector[j] ?? 0;
    simulatedState.available[j] -= req;
    simulatedState.allocation[processIndex][j] += req;
    simulatedState.need[processIndex][j] -= req;
  }

  // CHECK D: Run Banker's Safety Algorithm on the temporary simulated state
  const bankerResult = runBankersSafetyAlgorithm(simulatedState);

  // CHECK E & F: Commit if safe, Rollback if unsafe
  if (bankerResult.isSafe) {
    return {
      decision: 'SAFE_GRANTED',
      reason: `REQUEST GRANTED (Checks A, B, C, D Succeeded): Granting request [${requestVector.join(', ')}] to ${process.name} leaves the system in a verified SAFE STATE with execution sequence <${bankerResult.safeSequence.join(' -> ')}>. Changes have been committed to the system state.`,
      needCheckPassed: true,
      availableCheckPassed: true,
      safetyCheckPassed: true,
      simulatedState,
      finalState: simulatedState, // Committed!
      bankerResult,
    };
  } else {
    // Exact rollback to original state
    return {
      decision: 'UNSAFE_DENIED',
      reason: `REQUEST DENIED (Safety Check D Failed): Temporarily allocating [${requestVector.join(', ')}] to ${process.name} drives the system into an UNSAFE STATE where no safe sequence exists (${bankerResult.explanation}). To prevent potential deadlock, the request is rejected and the system state is rolled back completely.`,
      needCheckPassed: true,
      availableCheckPassed: true,
      safetyCheckPassed: false,
      simulatedState,
      finalState: cloneSystemState(currentState), // Rolled back!
      bankerResult,
    };
  }
}

/**
 * Creates a formatted transaction object for the audit log.
 */
export function createRequestTransaction(
  stateBefore: SystemState,
  processIndex: number,
  requestVector: number[],
  result: RequestEvaluationResult
): RequestTransaction {
  const process = stateBefore.processes[processIndex];
  return {
    id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toLocaleTimeString(),
    processId: process?.id || `P${processIndex}`,
    processName: process?.name || `Process ${processIndex}`,
    requestVector: [...requestVector],
    decision: result.decision,
    reason: result.reason,
    stateChanged: result.decision === 'SAFE_GRANTED',
    preAvailable: [...stateBefore.available],
    postAvailable: [...result.finalState.available],
    bankerSafeSequence: result.bankerResult?.safeSequence,
  };
}
