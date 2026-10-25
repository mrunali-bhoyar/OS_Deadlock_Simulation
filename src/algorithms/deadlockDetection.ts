import type {
  DeadlockDetectionResult,
  DeadlockDetectionState,
  DeadlockDetectionStep,
} from '../types';

/**
 * Deep clones a DeadlockDetectionState object.
 */
export function cloneDeadlockState(state: DeadlockDetectionState): DeadlockDetectionState {
  return {
    processes: state.processes.map((p) => ({ ...p })),
    resources: state.resources.map((r) => ({ ...r })),
    allocation: state.allocation.map((row) => [...row]),
    request: state.request.map((row) => [...row]),
    available: [...state.available],
  };
}

/**
 * Executes the Multiple-Instance Deadlock Detection Algorithm (Silberschatz / Tanenbaum standard).
 *
 * Distinct from Banker's:
 * - Uses current outstanding Request matrix instead of declared Maximum Need.
 * - Initialization: Finish[i] is TRUE if Allocation[i] is entirely 0 (process holds no resources, hence cannot be part of deadlock).
 * - Iteratively checks if Request[i] <= Work. If so, assumes process can obtain requested resources, finish, and release its Allocation.
 * - Any process with Finish[i] === false at termination is mathematically confirmed DEADLOCKED under the model's assumptions.
 */
export function runDeadlockDetection(state: DeadlockDetectionState): DeadlockDetectionResult {
  const pCount = state.processes.length;
  const rCount = state.resources.length;

  const work = [...state.available];
  const finish: boolean[] = new Array(pCount).fill(false);
  const steps: DeadlockDetectionStep[] = [];
  const resourceNames = state.resources.map((r) => r.name);

  let stepCounter = 1;

  // Step 1: Initialization
  // Finish[i] = true if Allocation[i] == 0, else false
  const initiallyFinished: string[] = [];
  for (let i = 0; i < pCount; i++) {
    const isAllocZero = state.allocation[i].every((val) => val === 0);
    if (isAllocZero) {
      finish[i] = true;
      initiallyFinished.push(state.processes[i].name);
    }
  }

  steps.push({
    stepNumber: stepCounter++,
    type: 'INITIAL',
    work: [...work],
    finish: [...finish],
    explanation: `Step 1 (Initialization): Work vector initialized to Available [${work.join(', ')}]. Finish array initialized: processes holding 0 resources are marked Finish=TRUE (${initiallyFinished.length > 0 ? initiallyFinished.join(', ') : 'None'}). Processes holding resources are marked Finish=FALSE.`,
  });

  let progressMade = true;

  while (progressMade) {
    progressMade = false;

    for (let i = 0; i < pCount; i++) {
      if (!finish[i]) {
        const process = state.processes[i];
        const reqRow = state.request[i];

        // Check if Request[i] <= Work
        let canSatisfy = true;
        for (let j = 0; j < rCount; j++) {
          if (reqRow[j] > work[j]) {
            canSatisfy = false;
            break;
          }
        }

        const reqStr = reqRow.map((req, idx) => `${resourceNames[idx]}:${req}`).join(', ');
        const workStr = work.map((w, idx) => `${resourceNames[idx]}:${w}`).join(', ');

        if (canSatisfy) {
          // Process can finish!
          progressMade = true;
          finish[i] = true;

          // Work = Work + Allocation[i]
          for (let j = 0; j < rCount; j++) {
            work[j] += state.allocation[i][j];
          }

          const allocStr = state.allocation[i].map((a, idx) => `${resourceNames[idx]}:${a}`).join(', ');
          const newWorkStr = work.map((w, idx) => `${resourceNames[idx]}:${w}`).join(', ');

          steps.push({
            stepNumber: stepCounter++,
            type: 'PROCESS_FINISHES',
            work: [...work],
            finish: [...finish],
            processIndex: i,
            processId: process.id,
            canFinish: true,
            explanation: `Process ${process.name} can complete! Outstanding Request [${reqStr}] <= Work [${workStr}]. Upon completion, it releases Allocation [${allocStr}], updating Work to [${newWorkStr}]. Finish[${process.name}] = TRUE.`,
          });
        } else {
          steps.push({
            stepNumber: stepCounter++,
            type: 'CHECK_REQUEST',
            work: [...work],
            finish: [...finish],
            processIndex: i,
            processId: process.id,
            canFinish: false,
            explanation: `Process ${process.name} must wait: Request [${reqStr}] exceeds current Work [${workStr}]. It holds resources while waiting.`,
          });
        }
      }
    }
  }

  // Final evaluation: Check which processes have Finish === false
  const deadlockedProcessIds: string[] = [];
  const finishedProcessIds: string[] = [];

  for (let i = 0; i < pCount; i++) {
    if (!finish[i]) {
      deadlockedProcessIds.push(state.processes[i].id);
    } else {
      finishedProcessIds.push(state.processes[i].id);
    }
  }

  const isDeadlocked = deadlockedProcessIds.length > 0;
  const deadlockedNames = state.processes
    .filter((p) => deadlockedProcessIds.includes(p.id))
    .map((p) => p.name);

  if (isDeadlocked) {
    steps.push({
      stepNumber: stepCounter++,
      type: 'COMPLETED',
      work: [...work],
      finish: [...finish],
      explanation: `Deadlock Detected! The algorithm stopped making progress. Processes {${deadlockedNames.join(', ')}} are deadlocked because they form an unresolvable waiting relationship holding resources while waiting for resources held by each other.`,
    });

    return {
      isDeadlocked: true,
      deadlockedProcessIds,
      finishedProcessIds,
      steps,
      explanation: `Deadlock confirmed for processes: ${deadlockedNames.join(', ')}. These processes cannot proceed because available resources cannot satisfy their requests, and the resources they need are held by other waiting processes.`,
    };
  } else {
    steps.push({
      stepNumber: stepCounter++,
      type: 'COMPLETED',
      work: [...work],
      finish: [...finish],
      explanation: `No Deadlock Detected! All processes were able to satisfy their outstanding requests and complete.`,
    });

    return {
      isDeadlocked: false,
      deadlockedProcessIds: [],
      finishedProcessIds,
      steps,
      explanation: `System is deadlock-free. All processes can successfully obtain their outstanding requests and release their resources.`,
    };
  }
}

/**
 * Recovery Mechanism: Terminates a deadlocked process, releases all of its allocated resources
 * back to the Available pool, clears its requests, and returns the modified state.
 */
export function terminateProcessAndRecover(
  currentState: DeadlockDetectionState,
  processIndex: number
): {
  updatedState: DeadlockDetectionState;
  releasedResources: number[];
  detectionAfterRecovery: DeadlockDetectionResult;
  terminatedProcessName: string;
} {
  const nextState = cloneDeadlockState(currentState);
  const process = nextState.processes[processIndex];
  const rCount = nextState.resources.length;
  const released = [...nextState.allocation[processIndex]];

  // Return allocated resources to Available
  for (let j = 0; j < rCount; j++) {
    nextState.available[j] += released[j];
    nextState.allocation[processIndex][j] = 0;
    nextState.request[processIndex][j] = 0;
  }

  // Rerun detection algorithm on updated state
  const detectionAfterRecovery = runDeadlockDetection(nextState);

  return {
    updatedState: nextState,
    releasedResources: released,
    detectionAfterRecovery,
    terminatedProcessName: process.name,
  };
}
