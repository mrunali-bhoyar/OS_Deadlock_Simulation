import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Info,
  Flame,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import {
  runDeadlockDetection,
  terminateProcessAndRecover,
} from '../algorithms/deadlockDetection';
import { MatrixTable } from '../components/common/MatrixTable';
import { VectorBadge } from '../components/common/VectorBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const DeadlockDetectionPage: React.FC = () => {
  const {
    detectionState,
    setDetectionState,
    resetDetectionScenario,
  } = useSystem();

  const [selectedProcessToKill, setSelectedProcessToKill] = useState<number>(2); // Default to P2
  const [lastRecoveryLog, setLastRecoveryLog] = useState<string | null>(null);

  // Execute detection algorithm on current detectionState
  const detectionResult = runDeadlockDetection(detectionState);

  // Identify index of deadlocked processes for row highlighting
  const deadlockedIndices = detectionState.processes
    .map((p, idx) => (detectionResult.deadlockedProcessIds.includes(p.id) ? idx : -1))
    .filter((idx) => idx !== -1);

  const handleTerminate = () => {
    const recovery = terminateProcessAndRecover(detectionState, selectedProcessToKill);
    setDetectionState(recovery.updatedState);
    const releasedStr = recovery.releasedResources
      .map((val, idx) => `${detectionState.resources[idx]?.name}:${val}`)
      .join(', ');
    setLastRecoveryLog(
      `Terminated process ${recovery.terminatedProcessName}. Released allocation [${releasedStr}]. Deadlock status: ${
        recovery.detectionAfterRecovery.isDeadlocked ? 'STILL DEADLOCKED' : 'RESOLVED (ALL CAN FINISH)'
      }.`
    );
  };

  return (
    <div className="page-container">
      {/* Top Banner and Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Multiple-Instance Deadlock Detection & Recovery
            </h2>
            <StatusBadge status={detectionResult.isDeadlocked ? 'DEADLOCKED' : 'SAFE'} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Uses current Allocation and Outstanding Request matrices. Unfinished processes represent confirmed deadlocks under the model's assumptions.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={resetDetectionScenario}>
            <RotateCcw size={14} />
            <span>Reset Deadlocked Scenario</span>
          </button>
        </div>
      </div>

      {/* Deadlock Detection KPI and Status Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              backgroundColor: detectionResult.isDeadlocked ? 'var(--badge-deadlocked-bg)' : 'var(--badge-safe-bg)',
              color: detectionResult.isDeadlocked ? 'var(--badge-deadlocked-text)' : 'var(--badge-safe-text)',
            }}
          >
            {detectionResult.isDeadlocked ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div className="stat-info">
            <span className="stat-label">Detection Status</span>
            <span
              className="stat-value"
              style={{
                fontSize: '1.25rem',
                color: detectionResult.isDeadlocked ? 'var(--badge-deadlocked-text)' : 'var(--badge-safe-text)',
              }}
            >
              {detectionResult.isDeadlocked ? 'DEADLOCK DETECTED' : 'NO DEADLOCK'}
            </span>
            <span className="stat-sub">
              {detectionResult.isDeadlocked
                ? `${detectionResult.deadlockedProcessIds.length} deadlocked processes`
                : 'All process requests satisfied'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Deadlocked Process Set</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
              {detectionResult.deadlockedProcessIds.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--emerald-600)', fontWeight: 600 }}>
                  Ø (Empty set - No deadlock)
                </span>
              ) : (
                detectionResult.deadlockedProcessIds.map((pid) => (
                  <span
                    key={pid}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--badge-deadlocked-bg)',
                      color: 'var(--badge-deadlocked-text)',
                      border: '1px solid var(--badge-deadlocked-border)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {pid}
                  </span>
                ))
              )}
            </div>
            <span className="stat-sub" style={{ marginTop: '0.3rem' }}>
              Holding resources while waiting circularly
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Currently Available [Work]</span>
            <div style={{ marginTop: '0.35rem' }}>
              <VectorBadge
                values={detectionState.available}
                resources={detectionState.resources}
                variant="emerald"
              />
            </div>
            <span className="stat-sub">Free instances in pool</span>
          </div>
        </div>
      </div>

      {/* Recovery Interactive Action Box */}
      <div
        className="card"
        style={{
          marginBottom: '1.75rem',
          borderLeft: '4px solid var(--rose-500)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={20} color="var(--rose-600)" />
            <div>
              <h3 className="card-title">Interactive Process Termination & Recovery</h3>
              <p className="card-subtitle">
                Select a deadlocked process to terminate. Its held resources will be released and detection will rerun automatically.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Victim Process:
            </label>
            <select
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
              }}
              value={selectedProcessToKill}
              onChange={(e) => setSelectedProcessToKill(parseInt(e.target.value, 10))}
            >
              {detectionState.processes.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.name} (Holds [{detectionState.allocation[idx]?.join(', ')}], Requests [{detectionState.request[idx]?.join(', ')}])
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-danger btn-sm" onClick={handleTerminate}>
            <Trash2 size={14} />
            <span>Terminate {detectionState.processes[selectedProcessToKill]?.name} & Reclaim Resources</span>
          </button>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            (Hint: Terminating <strong>P2</strong> releases [3, 0, 3] and allows P3, P4, and P1 to finish!)
          </span>
        </div>

        {lastRecoveryLog && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <strong>Recovery Execution Log:</strong> {lastRecoveryLog}
          </div>
        )}
      </div>

      {/* Detection Matrices: Allocation & Request */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <MatrixTable
          title="Allocation Matrix"
          subtitle="Resource ownership currently held by each process"
          processes={detectionState.processes}
          resources={detectionState.resources}
          data={detectionState.allocation}
          highlightedRowIndices={deadlockedIndices}
          variant="blue"
        />

        <MatrixTable
          title="Outstanding Request Matrix"
          subtitle="Resources currently requested and waited on by each process"
          processes={detectionState.processes}
          resources={detectionState.resources}
          data={detectionState.request}
          highlightedRowIndices={deadlockedIndices}
          variant="amber"
        />
      </div>

      {/* Step Trace Details */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Detection Iteration Trace</h3>
            <p className="card-subtitle">Execution steps of the multiple-instance detection algorithm</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {detectionResult.steps.map((st) => (
            <div
              key={st.stepNumber}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Step {st.stepNumber}: {st.type.replace('_', ' ')}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Work: [{st.work.join(', ')}]
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>{st.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model Assumptions and OS Concept Explanation */}
      <div className="card" style={{ borderLeft: '4px solid var(--cyan-500)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={22} color="var(--cyan-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Theoretical Principles of Multiple-Instance Deadlock Detection
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.6 }}>
              Unlike Banker's algorithm which evaluates future worst-case maximum claims, the Deadlock Detection algorithm operates on <em>actual current state</em> (real outstanding requests).
              Processes holding zero resources are marked Finish=TRUE during initialization because they cannot participate in a circular wait.
              If no remaining process can satisfy its request from available work, all remaining processes with Finish=FALSE are mathematically proven deadlocked under the assumption that processes do not voluntarily release resources before obtaining their requested allocations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
