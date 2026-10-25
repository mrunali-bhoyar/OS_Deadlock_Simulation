import type { DeadlockDetectionState, ResourceOrdering, SystemState } from '../types';
import { calculateNeedMatrix } from '../algorithms/validation';

/**
 * Built-in Classic Safe Scenario (Silberschatz OS Textbook Example)
 */
export const CLASSIC_SAFE_SCENARIO: SystemState = {
  id: 'classic-safe',
  name: "Classic Banker's Safe State (Silberschatz)",
  description:
    'Standard academic 5-process, 3-resource scenario demonstrating a proven safe sequence <P1, P3, P4, P0, P2>.',
  processes: [
    { id: 'P0', name: 'P0' },
    { id: 'P1', name: 'P1' },
    { id: 'P2', name: 'P2' },
    { id: 'P3', name: 'P3' },
    { id: 'P4', name: 'P4' },
  ],
  resources: [
    { id: 'R0', name: 'A', totalInstances: 10 },
    { id: 'R1', name: 'B', totalInstances: 5 },
    { id: 'R2', name: 'C', totalInstances: 7 },
  ],
  allocation: [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
    [2, 1, 1], // P3
    [0, 0, 2], // P4
  ],
  maximum: [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
    [2, 2, 2], // P3
    [4, 3, 3], // P4
  ],
  available: [3, 3, 2],
  need: calculateNeedMatrix(
    [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
    [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ]
  ),
};

/**
 * Dedicated Multi-Instance Deadlock Detection Scenario
 * P0 holds [0,1,0] with request [0,0,0] (finishes first).
 * Work becomes [0,1,0].
 * P1, P2, P3, P4 hold resources while waiting on each other; none can finish.
 * Terminating P2 releases [3,0,3], resolving deadlock completely!
 */
export const DEDICATED_DEADLOCK_SCENARIO: DeadlockDetectionState = {
  processes: [
    { id: 'P0', name: 'P0' },
    { id: 'P1', name: 'P1' },
    { id: 'P2', name: 'P2' },
    { id: 'P3', name: 'P3' },
    { id: 'P4', name: 'P4' },
  ],
  resources: [
    { id: 'R0', name: 'A', totalInstances: 7 },
    { id: 'R1', name: 'B', totalInstances: 2 },
    { id: 'R2', name: 'C', totalInstances: 6 },
  ],
  allocation: [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 3], // P2
    [2, 1, 1], // P3
    [0, 0, 2], // P4
  ],
  request: [
    [0, 0, 0], // P0 (can finish)
    [2, 0, 2], // P1 (needs A:2, C:2)
    [0, 0, 1], // P2 (needs C:1)
    [1, 0, 0], // P3 (needs A:1)
    [0, 0, 2], // P4 (needs C:2)
  ],
  available: [0, 0, 0],
};

/**
 * Deadlock-Free Detection Scenario (All requests can be satisfied)
 */
export const DEADLOCK_FREE_DETECTION_SCENARIO: DeadlockDetectionState = {
  processes: [
    { id: 'P0', name: 'P0' },
    { id: 'P1', name: 'P1' },
    { id: 'P2', name: 'P2' },
  ],
  resources: [
    { id: 'R0', name: 'CPU', totalInstances: 3 },
    { id: 'R1', name: 'Memory', totalInstances: 3 },
  ],
  allocation: [
    [1, 0],
    [1, 1],
    [0, 1],
  ],
  request: [
    [1, 0],
    [0, 1],
    [0, 0],
  ],
  available: [1, 1],
};

/**
 * Default Resource Ordering for Prevention Module
 */
export const DEFAULT_RESOURCE_ORDERING: ResourceOrdering = {
  R0: 1, // Lowest priority: e.g. Disk
  R1: 2, // Medium priority: e.g. Memory
  R2: 3, // Highest priority: e.g. Printer / GPU
};
