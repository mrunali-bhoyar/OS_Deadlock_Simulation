import type { SystemState } from '../types';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a SystemState matrix and vector configurations.
 */
export function validateSystemState(state: Partial<SystemState>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!state.processes || state.processes.length === 0) {
    errors.push('System must have at least one process.');
    return { isValid: false, errors, warnings };
  }

  if (!state.resources || state.resources.length === 0) {
    errors.push('System must have at least one resource type.');
    return { isValid: false, errors, warnings };
  }

  const pCount = state.processes.length;
  const rCount = state.resources.length;

  // Check unique IDs and names
  const processIds = new Set<string>();
  state.processes.forEach((p, idx) => {
    if (!p.id || !p.id.trim()) {
      errors.push(`Process at index ${idx} is missing an identifier.`);
    } else if (processIds.has(p.id)) {
      errors.push(`Duplicate process identifier: "${p.id}".`);
    } else {
      processIds.add(p.id);
    }
  });

  const resourceIds = new Set<string>();
  state.resources.forEach((r, idx) => {
    if (!r.id || !r.id.trim()) {
      errors.push(`Resource at index ${idx} is missing an identifier.`);
    } else if (resourceIds.has(r.id)) {
      errors.push(`Duplicate resource identifier: "${r.id}".`);
    } else {
      resourceIds.add(r.id);
    }
  });

  // Check Available vector
  if (!state.available || state.available.length !== rCount) {
    errors.push(`Available vector dimension mismatch: expected ${rCount} entries, got ${state.available?.length ?? 0}.`);
  } else {
    state.available.forEach((val, j) => {
      if (typeof val !== 'number' || isNaN(val) || !Number.isInteger(val)) {
        errors.push(`Available resource ${state.resources?.[j]?.name || j} must be an integer.`);
      } else if (val < 0) {
        errors.push(`Available resource ${state.resources?.[j]?.name || j} cannot be negative (got ${val}).`);
      }
    });
  }

  // Check Allocation matrix
  if (!state.allocation || state.allocation.length !== pCount) {
    errors.push(`Allocation matrix rows mismatch: expected ${pCount} processes, got ${state.allocation?.length ?? 0}.`);
  } else {
    for (let i = 0; i < pCount; i++) {
      const row = state.allocation[i];
      if (!row || row.length !== rCount) {
        errors.push(`Allocation row for ${state.processes[i]?.name || i} must have ${rCount} resource values.`);
        continue;
      }
      for (let j = 0; j < rCount; j++) {
        const val = row[j];
        if (typeof val !== 'number' || isNaN(val) || !Number.isInteger(val)) {
          errors.push(`Allocation[${state.processes[i]?.name}][${state.resources[j]?.name}] must be an integer.`);
        } else if (val < 0) {
          errors.push(`Allocation[${state.processes[i]?.name}][${state.resources[j]?.name}] cannot be negative (${val}).`);
        }
      }
    }
  }

  // Check Maximum matrix
  if (!state.maximum || state.maximum.length !== pCount) {
    errors.push(`Maximum matrix rows mismatch: expected ${pCount} processes, got ${state.maximum?.length ?? 0}.`);
  } else {
    for (let i = 0; i < pCount; i++) {
      const row = state.maximum[i];
      if (!row || row.length !== rCount) {
        errors.push(`Maximum row for ${state.processes[i]?.name || i} must have ${rCount} resource values.`);
        continue;
      }
      for (let j = 0; j < rCount; j++) {
        const val = row[j];
        if (typeof val !== 'number' || isNaN(val) || !Number.isInteger(val)) {
          errors.push(`Maximum[${state.processes[i]?.name}][${state.resources[j]?.name}] must be an integer.`);
        } else if (val < 0) {
          errors.push(`Maximum[${state.processes[i]?.name}][${state.resources[j]?.name}] cannot be negative (${val}).`);
        }
      }
    }
  }

  // Check Allocation <= Maximum
  if (state.allocation && state.maximum && errors.length === 0) {
    for (let i = 0; i < pCount; i++) {
      for (let j = 0; j < rCount; j++) {
        const alloc = state.allocation[i]?.[j] ?? 0;
        const max = state.maximum[i]?.[j] ?? 0;
        if (alloc > max) {
          errors.push(
            `Violation: Allocation (${alloc}) exceeds Maximum (${max}) for process ${state.processes[i].name} on resource ${state.resources[j].name}.`
          );
        }
      }
    }
  }

  // Check Total Resource consistency if totalInstances defined
  if (state.resources && state.allocation && state.available && errors.length === 0) {
    for (let j = 0; j < rCount; j++) {
      let allocatedTotal = 0;
      for (let i = 0; i < pCount; i++) {
        allocatedTotal += state.allocation[i][j];
      }
      const totalSystem = allocatedTotal + state.available[j];
      const specifiedTotal = state.resources[j].totalInstances;
      if (specifiedTotal !== undefined && specifiedTotal !== totalSystem) {
        warnings.push(
          `Resource ${state.resources[j].name}: total instances (${specifiedTotal}) differs from sum of allocated (${allocatedTotal}) + available (${state.available[j]}) = ${totalSystem}. System will synchronize to ${totalSystem}.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculates Need matrix: Need[i][j] = Maximum[i][j] - Allocation[i][j]
 */
export function calculateNeedMatrix(maximum: number[][], allocation: number[][]): number[][] {
  const pCount = maximum.length;
  const need: number[][] = [];

  for (let i = 0; i < pCount; i++) {
    const row: number[] = [];
    const rCount = maximum[i]?.length ?? 0;
    for (let j = 0; j < rCount; j++) {
      const maxVal = maximum[i]?.[j] ?? 0;
      const allocVal = allocation[i]?.[j] ?? 0;
      row.push(Math.max(0, maxVal - allocVal));
    }
    need.push(row);
  }

  return need;
}
