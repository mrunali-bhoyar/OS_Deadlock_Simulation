import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  ActivePage,
  DeadlockDetectionState,
  RequestTransaction,
  ResourceOrdering,
  SystemState,
  TestCaseResult,
  Theme,
} from '../types';
import {
  CLASSIC_SAFE_SCENARIO,
  DEDICATED_DEADLOCK_SCENARIO,
  DEFAULT_RESOURCE_ORDERING,
} from '../data/scenarios';
import { calculateNeedMatrix, validateSystemState } from '../algorithms/validation';
import { terminateProcessAndRecover } from '../algorithms/deadlockDetection';

interface SystemContextType {
  systemState: SystemState;
  detectionState: DeadlockDetectionState;
  resourceOrdering: ResourceOrdering;
  requestHistory: RequestTransaction[];
  activePage: ActivePage;
  isSidebarCollapsed: boolean;
  testResults: Record<string, TestCaseResult>;
  theme: Theme;
  setActivePage: (page: ActivePage) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setSystemState: (state: SystemState) => void;
  setDetectionState: (state: DeadlockDetectionState) => void;
  updateAllocationCell: (pIdx: number, rIdx: number, val: number) => void;
  updateMaximumCell: (pIdx: number, rIdx: number, val: number) => void;
  updateAvailableCell: (rIdx: number, val: number) => void;
  addProcess: (name?: string) => void;
  removeProcess: (index: number) => void;
  addResource: (name?: string, totalInstances?: number) => void;
  removeResource: (index: number) => void;
  resetToClassicSafe: () => void;
  loadDemoScenario: (id: string) => void;
  exportSystemStateJSON: () => string;
  importSystemStateJSON: (jsonStr: string) => { success: boolean; error?: string };
  resetDetectionScenario: () => void;
  terminateDetectionProcess: (pIdx: number) => void;
  addRequestTransaction: (tx: RequestTransaction) => void;
  clearRequestHistory: () => void;
  setResourceOrdering: (ordering: ResourceOrdering) => void;
  setTestResult: (id: string, result: TestCaseResult) => void;
  setAllTestResults: (results: Record<string, TestCaseResult>) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

const STORAGE_KEY_SYSTEM = 'os_ia_system_state_v1';
const STORAGE_KEY_HISTORY = 'os_ia_request_history_v1';
const STORAGE_KEY_THEME = 'os_ia_theme_v1';

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // fallback
    }
    return 'dark'; // High-contrast modern dark mode by default
  });

  // Apply theme to document attribute
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Initialize SystemState from LocalStorage safely
  const [systemState, setSystemStateInternal] = useState<SystemState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYSTEM);
      if (saved) {
        const parsed = JSON.parse(saved);
        const val = validateSystemState(parsed);
        if (val.isValid) {
          parsed.need = calculateNeedMatrix(parsed.maximum, parsed.allocation);
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return CLASSIC_SAFE_SCENARIO;
  });

  // Dedicated Detection State
  const [detectionState, setDetectionState] = useState<DeadlockDetectionState>(DEDICATED_DEADLOCK_SCENARIO);

  // Deadlock Prevention Resource Ordering
  const [resourceOrdering, setResourceOrdering] = useState<ResourceOrdering>(DEFAULT_RESOURCE_ORDERING);

  // Request Transactions Audit History
  const [requestHistory, setRequestHistory] = useState<RequestTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Test Lab Cached Results
  const [testResults, setTestResults] = useState<Record<string, TestCaseResult>>({});

  // Sync SystemState to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SYSTEM, JSON.stringify(systemState));
    } catch {
      // ignore
    }
  }, [systemState]);

  // Sync Request History to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(requestHistory));
    } catch {
      // ignore
    }
  }, [requestHistory]);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  const setSystemState = (newState: SystemState) => {
    const updatedNeed = calculateNeedMatrix(newState.maximum, newState.allocation);
    setSystemStateInternal({
      ...newState,
      need: updatedNeed,
    });
  };

  const updateAllocationCell = (pIdx: number, rIdx: number, val: number) => {
    setSystemStateInternal((prev) => {
      const nextAlloc = prev.allocation.map((row, r) =>
        r === pIdx ? row.map((cell, c) => (c === rIdx ? val : cell)) : [...row]
      );
      const nextNeed = calculateNeedMatrix(prev.maximum, nextAlloc);
      return {
        ...prev,
        allocation: nextAlloc,
        need: nextNeed,
      };
    });
  };

  const updateMaximumCell = (pIdx: number, rIdx: number, val: number) => {
    setSystemStateInternal((prev) => {
      const nextMax = prev.maximum.map((row, r) =>
        r === pIdx ? row.map((cell, c) => (c === rIdx ? val : cell)) : [...row]
      );
      const nextNeed = calculateNeedMatrix(nextMax, prev.allocation);
      return {
        ...prev,
        maximum: nextMax,
        need: nextNeed,
      };
    });
  };

  const updateAvailableCell = (rIdx: number, val: number) => {
    setSystemStateInternal((prev) => {
      const nextAvail = prev.available.map((c, i) => (i === rIdx ? val : c));
      return {
        ...prev,
        available: nextAvail,
      };
    });
  };

  const addProcess = (name?: string) => {
    setSystemStateInternal((prev) => {
      const newIndex = prev.processes.length;
      const pName = name || `P${newIndex}`;
      const newProcess = { id: `P${newIndex}`, name: pName };
      const rCount = prev.resources.length;

      const newAlloc = [...prev.allocation, new Array(rCount).fill(0)];
      const newMax = [...prev.maximum, new Array(rCount).fill(0)];
      const newNeed = calculateNeedMatrix(newMax, newAlloc);

      return {
        ...prev,
        processes: [...prev.processes, newProcess],
        allocation: newAlloc,
        maximum: newMax,
        need: newNeed,
      };
    });
  };

  const removeProcess = (index: number) => {
    setSystemStateInternal((prev) => {
      if (prev.processes.length <= 1) return prev; // Keep at least one

      const nextProcesses = prev.processes.filter((_, idx) => idx !== index);
      const nextAlloc = prev.allocation.filter((_, idx) => idx !== index);
      const nextMax = prev.maximum.filter((_, idx) => idx !== index);
      const nextNeed = calculateNeedMatrix(nextMax, nextAlloc);

      return {
        ...prev,
        processes: nextProcesses,
        allocation: nextAlloc,
        maximum: nextMax,
        need: nextNeed,
      };
    });
  };

  const addResource = (name?: string, totalInstances: number = 5) => {
    setSystemStateInternal((prev) => {
      const newIndex = prev.resources.length;
      const rName = name || String.fromCharCode(65 + newIndex); // A, B, C, D...
      const newResource = { id: `R${newIndex}`, name: rName, totalInstances };

      const nextAlloc = prev.allocation.map((row) => [...row, 0]);
      const nextMax = prev.maximum.map((row) => [...row, 0]);
      const nextAvail = [...prev.available, totalInstances];
      const nextNeed = calculateNeedMatrix(nextMax, nextAlloc);

      return {
        ...prev,
        resources: [...prev.resources, newResource],
        allocation: nextAlloc,
        maximum: nextMax,
        available: nextAvail,
        need: nextNeed,
      };
    });
  };

  const removeResource = (index: number) => {
    setSystemStateInternal((prev) => {
      if (prev.resources.length <= 1) return prev; // Keep at least one

      const nextResources = prev.resources.filter((_, idx) => idx !== index);
      const nextAlloc = prev.allocation.map((row) => row.filter((_, idx) => idx !== index));
      const nextMax = prev.maximum.map((row) => row.filter((_, idx) => idx !== index));
      const nextAvail = prev.available.filter((_, idx) => idx !== index);
      const nextNeed = calculateNeedMatrix(nextMax, nextAlloc);

      return {
        ...prev,
        resources: nextResources,
        allocation: nextAlloc,
        maximum: nextMax,
        available: nextAvail,
        need: nextNeed,
      };
    });
  };

  const resetToClassicSafe = () => {
    setSystemStateInternal(CLASSIC_SAFE_SCENARIO);
  };

  const loadDemoScenario = (id: string) => {
    if (id === 'classic-safe') {
      setSystemStateInternal(CLASSIC_SAFE_SCENARIO);
    }
  };

  const exportSystemStateJSON = (): string => {
    return JSON.stringify(systemState, null, 2);
  };

  const importSystemStateJSON = (jsonStr: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      const val = validateSystemState(parsed);
      if (!val.isValid) {
        return { success: false, error: val.errors.join('; ') };
      }
      parsed.need = calculateNeedMatrix(parsed.maximum, parsed.allocation);
      setSystemStateInternal(parsed);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Invalid JSON format',
      };
    }
  };

  const resetDetectionScenario = () => {
    setDetectionState(DEDICATED_DEADLOCK_SCENARIO);
  };

  const terminateDetectionProcess = (pIdx: number) => {
    const recovery = terminateProcessAndRecover(detectionState, pIdx);
    setDetectionState(recovery.updatedState);
  };

  const addRequestTransaction = (tx: RequestTransaction) => {
    setRequestHistory((prev) => [tx, ...prev]);
  };

  const clearRequestHistory = () => {
    setRequestHistory([]);
  };

  const setTestResult = (id: string, result: TestCaseResult) => {
    setTestResults((prev) => ({ ...prev, [id]: result }));
  };

  const setAllTestResults = (results: Record<string, TestCaseResult>) => {
    setTestResults(results);
  };

  return (
    <SystemContext.Provider
      value={{
        systemState,
        detectionState,
        resourceOrdering,
        requestHistory,
        activePage,
        isSidebarCollapsed,
        testResults,
        theme,
        setActivePage,
        toggleSidebar,
        toggleTheme,
        setTheme,
        setSystemState,
        setDetectionState,
        updateAllocationCell,
        updateMaximumCell,
        updateAvailableCell,
        addProcess,
        removeProcess,
        addResource,
        removeResource,
        resetToClassicSafe,
        loadDemoScenario,
        exportSystemStateJSON,
        importSystemStateJSON,
        resetDetectionScenario,
        terminateDetectionProcess,
        addRequestTransaction,
        clearRequestHistory,
        setResourceOrdering,
        setTestResult,
        setAllTestResults,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
