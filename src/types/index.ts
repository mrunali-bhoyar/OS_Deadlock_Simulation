// Core TypeScript interfaces and types for Deadlock Analysis Dashboard

export interface Resource {
  id: string;
  name: string;
  totalInstances: number;
}

export interface Process {
  id: string;
  name: string;
}

export interface SystemState {
  id: string;
  name: string;
  description: string;
  processes: Process[];
  resources: Resource[];
  // Dimensions: [processCount][resourceCount]
  allocation: number[][];
  maximum: number[][];
  // Dimension: [resourceCount]
  available: number[];
  // Derived automatically: Maximum[i][j] - Allocation[i][j]
  need: number[][];
}

// Banker's Algorithm Types
export interface BankerStep {
  stepNumber: number;
  type: 'INITIAL' | 'CHECK_PROCESS' | 'ALLOCATE_WORK' | 'FINISHED_SAFE' | 'UNSAFE_STUCK';
  processId?: string;
  processIndex?: number;
  work: number[];
  finish: boolean[];
  safeSequence: string[];
  explanation: string;
  canFinish?: boolean;
  needCheck?: {
    need: number[];
    work: number[];
    satisfied: boolean;
  };
}

export interface BankerResult {
  isSafe: boolean;
  safeSequence: string[];
  steps: BankerStep[];
  explanation: string;
  workHistory: number[][];
  finishHistory: boolean[][];
}

// Resource Request Simulator Types
export type RequestDecision = 'SAFE_GRANTED' | 'UNSAFE_DENIED' | 'EXCEEDS_NEED' | 'EXCEEDS_AVAILABLE';

export interface RequestTransaction {
  id: string;
  timestamp: string;
  processId: string;
  processName: string;
  requestVector: number[];
  decision: RequestDecision;
  reason: string;
  stateChanged: boolean;
  preAvailable: number[];
  postAvailable: number[];
  bankerSafeSequence?: string[];
}

export interface RequestEvaluationResult {
  decision: RequestDecision;
  reason: string;
  needCheckPassed: boolean;
  availableCheckPassed: boolean;
  safetyCheckPassed: boolean;
  simulatedState?: SystemState;
  finalState: SystemState;
  bankerResult?: BankerResult;
}

// Deadlock Detection Types
export interface DeadlockDetectionState {
  processes: Process[];
  resources: Resource[];
  allocation: number[][];
  request: number[][]; // outstanding requests
  available: number[];
}

export interface DeadlockDetectionStep {
  stepNumber: number;
  type: 'INITIAL' | 'CHECK_REQUEST' | 'PROCESS_FINISHES' | 'NO_PROGRESS' | 'COMPLETED';
  work: number[];
  finish: boolean[];
  processIndex?: number;
  processId?: string;
  canFinish?: boolean;
  explanation: string;
}

export interface DeadlockDetectionResult {
  isDeadlocked: boolean;
  deadlockedProcessIds: string[];
  finishedProcessIds: string[];
  steps: DeadlockDetectionStep[];
  explanation: string;
}

// Deadlock Prevention Types
export interface ResourceOrdering {
  [resourceId: string]: number; // e.g. { R0: 1, R1: 2, R2: 3 }
}

export interface PreventionSimulationResult {
  isAllowed: boolean;
  reason: string;
  violatingResourceId?: string;
  highestHeldOrder: number;
  requestedOrder: number;
  explanation: string;
}

// Test Lab Types
export interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  description: string;
  initialStateSummary: string;
  inputAction: string;
  computedResult: string;
  expectedResult: string;
  passed: boolean;
  explanation: string;
  status: 'NOT_RUN' | 'RUNNING' | 'PASSED' | 'FAILED';
  executionTimeMs?: number;
}

// Navigation Pages
export type ActivePage =
  | 'overview'
  | 'config'
  | 'bankers'
  | 'request'
  | 'detection'
  | 'prevention'
  | 'rag'
  | 'testlab'
  | 'results';

export type Theme = 'light' | 'dark';
