import type { BankerResult, BankerStep, SystemState } from '../types';
import { calculateNeedMatrix } from './validation';

/**
 * Executes Dijkstra's Banker's Safety Algorithm step-by-step on a SystemState.
 * Returns the safety outcome, the calculated safe sequence, and a complete trace of steps.
 */
export function runBankersSafetyAlgorithm(state: SystemState): BankerResult {
  const pCount = state.processes.length;
  const rCount = state.resources.length;

  // Compute or ensure Need matrix
  const need = state.need && state.need.length === pCount
    ? state.need
    : calculateNeedMatrix(state.maximum, state.allocation);

  // Initialize Work vector and Finish array
  const work: number[] = [...state.available];
  const finish: boolean[] = new Array(pCount).fill(false);
  const safeSequence: string[] = [];
  const steps: BankerStep[] = [];
  const workHistory: number[][] = [[...work]];
  const finishHistory: boolean[][] = [[...finish]];

  let stepCounter = 1;

  // Step 0: Initial State
  steps.push({
    stepNumber: stepCounter++,
    type: 'INITIAL',
    work: [...work],
    finish: [...finish],
    safeSequence: [],
    explanation: `Initialization: Work vector is set to current Available resources [${work.join(', ')}]. Finish is initialized to FALSE for all ${pCount} processes.`,
  });

  let foundProcessInPass = true;
  let passCount = 0;

  // Outer loop: repeat until no more processes can be safely satisfied or all have finished
  while (foundProcessInPass && safeSequence.length < pCount) {
    foundProcessInPass = false;
    passCount++;

    for (let i = 0; i < pCount; i++) {
      if (!finish[i]) {
        const process = state.processes[i];
        const processNeed = need[i];

        // Check if Need_i <= Work
        let canSatisfy = true;
        for (let j = 0; j < rCount; j++) {
          if (processNeed[j] > work[j]) {
            canSatisfy = false;
            break;
          }
        }

        // Record evaluation step
        const resourceNames = state.resources.map((r) => r.name);
        const needStr = processNeed.map((n, idx) => `${resourceNames[idx]}:${n}`).join(', ');
        const workStr = work.map((w, idx) => `${resourceNames[idx]}:${w}`).join(', ');

        if (canSatisfy) {
          // Process can be allocated and complete
          foundProcessInPass = true;
          finish[i] = true;
          safeSequence.push(process.name);

          // Work = Work + Allocation_i
          const prevWork = [...work];
          for (let j = 0; j < rCount; j++) {
            work[j] += state.allocation[i][j];
          }

          workHistory.push([...work]);
          finishHistory.push([...finish]);

          const allocStr = state.allocation[i].map((a, idx) => `${resourceNames[idx]}:${a}`).join(', ');
          const newWorkStr = work.map((w, idx) => `${resourceNames[idx]}:${w}`).join(', ');

          steps.push({
            stepNumber: stepCounter++,
            type: 'ALLOCATE_WORK',
            processId: process.id,
            processIndex: i,
            work: [...work],
            finish: [...finish],
            safeSequence: [...safeSequence],
            canFinish: true,
            needCheck: {
              need: [...processNeed],
              work: [...prevWork],
              satisfied: true,
            },
            explanation: `Process ${process.name} can safely execute! Remaining Need [${needStr}] <= Available Work [${workStr}]. Upon completion, it releases its allocated resources [${allocStr}], updating Work to [${newWorkStr}]. Finish[${process.name}] = TRUE.`,
          });
        } else {
          // Did not satisfy on this check
          steps.push({
            stepNumber: stepCounter++,
            type: 'CHECK_PROCESS',
            processId: process.id,
            processIndex: i,
            work: [...work],
            finish: [...finish],
            safeSequence: [...safeSequence],
            canFinish: false,
            needCheck: {
              need: [...processNeed],
              work: [...work],
              satisfied: false,
            },
            explanation: `Process ${process.name} cannot be satisfied yet: Need [${needStr}] exceeds current Work [${workStr}]. Process must wait for other processes to release resources.`,
          });
        }
      }
    }
  }

  const allFinished = finish.every((f) => f === true);

  if (allFinished) {
    steps.push({
      stepNumber: stepCounter++,
      type: 'FINISHED_SAFE',
      work: [...work],
      finish: [...finish],
      safeSequence: [...safeSequence],
      explanation: `System is in a SAFE STATE! All ${pCount} processes can safely terminate in sequence: <${safeSequence.join(', ')}>. There is no possibility of deadlock.`,
    });

    return {
      isSafe: true,
      safeSequence,
      steps,
      workHistory,
      finishHistory,
      explanation: `Safe state confirmed. All processes can successfully acquire their maximum demands and terminate in sequence: <${safeSequence.join(' -> ')}>.`,
    };
  } else {
    const unfinishedProcesses = state.processes
      .filter((_, idx) => !finish[idx])
      .map((p) => p.name);

    steps.push({
      stepNumber: stepCounter++,
      type: 'UNSAFE_STUCK',
      work: [...work],
      finish: [...finish],
      safeSequence: [...safeSequence],
      explanation: `Algorithm terminated: NO safe sequence exists! Remaining processes [${unfinishedProcesses.join(', ')}] have Need exceeding Available Work [${work.join(', ')}]. The system is in an UNSAFE STATE.`,
    });

    return {
      isSafe: false,
      safeSequence,
      steps,
      workHistory,
      finishHistory,
      explanation: `Unsafe state detected. No safe execution sequence exists for remaining processes: ${unfinishedProcesses.join(', ')}. While an unsafe state is NOT synonymous with deadlock, deadlock could occur if all processes request their maximum claims simultaneously.`,
    };
  }
}
