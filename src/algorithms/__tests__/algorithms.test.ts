import { describe, expect, it } from 'vitest';
import { runBankersSafetyAlgorithm } from '../bankersSafety';
import { runDeadlockDetection, terminateProcessAndRecover } from '../deadlockDetection';
import { evaluateResourceOrderingRequest } from '../deadlockPrevention';
import { evaluateResourceRequest } from '../resourceRequest';
import { calculateNeedMatrix, validateSystemState } from '../validation';
import {
  CLASSIC_SAFE_SCENARIO,
  DEDICATED_DEADLOCK_SCENARIO,
  DEFAULT_RESOURCE_ORDERING,
} from '../../data/scenarios';
import { runTC1, runTC2, runTC3, runTC4, runTC5, runTC6 } from '../../testLab/testCases';

describe("Dijkstra's Banker's Algorithm", () => {
  it('correctly calculates Need matrix: Need[i][j] = Maximum[i][j] - Allocation[i][j]', () => {
    const need = calculateNeedMatrix(CLASSIC_SAFE_SCENARIO.maximum, CLASSIC_SAFE_SCENARIO.allocation);
    expect(need[0]).toEqual([7, 4, 3]);
    expect(need[1]).toEqual([1, 2, 2]);
    expect(need[2]).toEqual([6, 0, 0]);
    expect(need[3]).toEqual([0, 1, 1]);
    expect(need[4]).toEqual([4, 3, 1]);
  });

  it('proves classic textbook state is safe and outputs a complete safe sequence', () => {
    const result = runBankersSafetyAlgorithm(CLASSIC_SAFE_SCENARIO);
    expect(result.isSafe).toBe(true);
    expect(result.safeSequence.length).toBe(5);
    // P1 or P3 can be satisfied initially with Work [3,3,2]
    expect(['P1', 'P3']).toContain(result.safeSequence[0]);
  });

  it('handles an unsafe state where no process can proceed', () => {
    const unsafeState = {
      ...CLASSIC_SAFE_SCENARIO,
      available: [0, 0, 0], // Zero resources available
      need: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
    };
    const result = runBankersSafetyAlgorithm(unsafeState);
    expect(result.isSafe).toBe(false);
    expect(result.safeSequence.length).toBe(0);
  });
});

describe('Resource Request Simulator', () => {
  it('rejects a request exceeding Need (Check A)', () => {
    const result = evaluateResourceRequest(CLASSIC_SAFE_SCENARIO, 0, [8, 0, 0]); // Need A is 7
    expect(result.decision).toBe('EXCEEDS_NEED');
    expect(result.needCheckPassed).toBe(false);
  });

  it('rejects an unavailable request exceeding Available without changing state (Check B)', () => {
    const origAvailable = [...CLASSIC_SAFE_SCENARIO.available];
    const result = evaluateResourceRequest(CLASSIC_SAFE_SCENARIO, 0, [4, 1, 0]); // Avail A is 3
    expect(result.decision).toBe('EXCEEDS_AVAILABLE');
    expect(result.needCheckPassed).toBe(true);
    expect(result.availableCheckPassed).toBe(false);
    expect(result.finalState.available).toEqual(origAvailable);
  });

  it('TC3: denies unsafe request for P4 [3,3,0] and restores exact initial state', () => {
    const result = evaluateResourceRequest(CLASSIC_SAFE_SCENARIO, 4, [3, 3, 0]);
    expect(result.decision).toBe('UNSAFE_DENIED');
    expect(result.needCheckPassed).toBe(true);
    expect(result.availableCheckPassed).toBe(true);
    expect(result.safetyCheckPassed).toBe(false);
    expect(result.finalState.available).toEqual(CLASSIC_SAFE_SCENARIO.available);
    expect(result.finalState.allocation[4]).toEqual(CLASSIC_SAFE_SCENARIO.allocation[4]);
  });

  it('grants a safe request and commits updated state', () => {
    // P1 requests [1, 0, 2]
    // P1 Need is [1, 2, 2], Available is [3, 3, 2]
    const result = evaluateResourceRequest(CLASSIC_SAFE_SCENARIO, 1, [1, 0, 2]);
    expect(result.decision).toBe('SAFE_GRANTED');
    expect(result.safetyCheckPassed).toBe(true);
    expect(result.finalState.available).toEqual([2, 3, 0]);
    expect(result.finalState.allocation[1]).toEqual([3, 0, 2]);
  });
});

describe('Multiple-Instance Deadlock Detection & Recovery', () => {
  it('detects genuine deadlock in dedicated circular waiting scenario', () => {
    const result = runDeadlockDetection(DEDICATED_DEADLOCK_SCENARIO);
    expect(result.isDeadlocked).toBe(true);
    expect(result.deadlockedProcessIds).toEqual(expect.arrayContaining(['P1', 'P2', 'P3', 'P4']));
    expect(result.deadlockedProcessIds).not.toContain('P0'); // P0 finished
  });

  it('recovers from deadlock when P2 is terminated and released', () => {
    const recovery = terminateProcessAndRecover(DEDICATED_DEADLOCK_SCENARIO, 2);
    expect(recovery.releasedResources).toEqual([3, 0, 3]);
    expect(recovery.detectionAfterRecovery.isDeadlocked).toBe(false);
    expect(recovery.detectionAfterRecovery.deadlockedProcessIds.length).toBe(0);
  });
});

describe('Deadlock Prevention via Total Resource Ordering', () => {
  it('allows request following ascending resource ordering', () => {
    const allResources = [
      { id: 'R0', name: 'Disk', totalInstances: 2 },
      { id: 'R1', name: 'Memory', totalInstances: 2 },
      { id: 'R2', name: 'Printer', totalInstances: 2 },
    ];
    const res = evaluateResourceOrderingRequest(DEFAULT_RESOURCE_ORDERING, allResources, ['R0'], 'R2');
    expect(res.isAllowed).toBe(true);
  });

  it('rejects out-of-order request that could induce circular wait', () => {
    const allResources = [
      { id: 'R0', name: 'Disk', totalInstances: 2 },
      { id: 'R1', name: 'Memory', totalInstances: 2 },
      { id: 'R2', name: 'Printer', totalInstances: 2 },
    ];
    const res = evaluateResourceOrderingRequest(DEFAULT_RESOURCE_ORDERING, allResources, ['R2'], 'R0');
    expect(res.isAllowed).toBe(false);
  });
});

describe('System State Validation', () => {
  it('flags Allocation exceeding Maximum', () => {
    const badState = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'A', totalInstances: 5 }],
      allocation: [[10]],
      maximum: [[5]],
      available: [0],
    };
    const res = validateSystemState(badState);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('exceeds Maximum');
  });

  it('flags negative numbers in vectors', () => {
    const badState = {
      processes: [{ id: 'P0', name: 'P0' }],
      resources: [{ id: 'R0', name: 'A', totalInstances: 5 }],
      allocation: [[0]],
      maximum: [[5]],
      available: [-3],
    };
    const res = validateSystemState(badState);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('negative');
  });
});

describe('Test Lab Suite TC1 to TC6', () => {
  it('TC1 passes', () => {
    const res = runTC1();
    expect(res.passed).toBe(true);
  });

  it('TC2 passes', () => {
    const res = runTC2();
    expect(res.passed).toBe(true);
  });

  it('TC3 passes', () => {
    const res = runTC3();
    expect(res.passed).toBe(true);
  });

  it('TC4 passes', () => {
    const res = runTC4();
    expect(res.passed).toBe(true);
  });

  it('TC5 passes', () => {
    const res = runTC5();
    expect(res.passed).toBe(true);
  });

  it('TC6 passes', () => {
    const res = runTC6();
    expect(res.passed).toBe(true);
  });
});
