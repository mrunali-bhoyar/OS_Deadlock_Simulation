import React, { useState } from 'react';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Clock,
  History,
  Trash2,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { evaluateResourceRequest, createRequestTransaction } from '../algorithms/resourceRequest';
import { VectorBadge } from '../components/common/VectorBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import type { RequestEvaluationResult } from '../types';

export const RequestSimulatorPage: React.FC = () => {
  const {
    systemState,
    setSystemState,
    requestHistory,
    addRequestTransaction,
    clearRequestHistory,
  } = useSystem();

  const [selectedProcessIdx, setSelectedProcessIdx] = useState<number>(0);
  const [requestVector, setRequestVector] = useState<number[]>(() =>
    new Array(systemState.resources.length).fill(0)
  );
  const [evaluationResult, setEvaluationResult] = useState<RequestEvaluationResult | null>(null);

  // Sync vector length if resource count changes
  if (requestVector.length !== systemState.resources.length) {
    setRequestVector(new Array(systemState.resources.length).fill(0));
  }

  const selectedNeed = systemState.need[selectedProcessIdx] || [];

  const handleVectorChange = (rIdx: number, val: number) => {
    const next = [...requestVector];
    next[rIdx] = Math.max(0, val);
    setRequestVector(next);
  };

  const handleEvaluate = () => {
    const result = evaluateResourceRequest(systemState, selectedProcessIdx, requestVector);
    setEvaluationResult(result);

    // Record transaction
    const tx = createRequestTransaction(systemState, selectedProcessIdx, requestVector, result);
    addRequestTransaction(tx);

    // If granted, commit state to system
    if (result.decision === 'SAFE_GRANTED') {
      setSystemState(result.finalState);
    }
  };

  // Preset Buttons for rapid testing
  const loadPresetTC3 = () => {
    // Find P4 (or index 4)
    const p4Idx = systemState.processes.findIndex((p) => p.name === 'P4');
    const targetIdx = p4Idx >= 0 ? p4Idx : 0;
    setSelectedProcessIdx(targetIdx);
    setRequestVector([3, 3, 0]);
  };

  const loadPresetSafe = () => {
    // P1 requests [1, 0, 2]
    const p1Idx = systemState.processes.findIndex((p) => p.name === 'P1');
    const targetIdx = p1Idx >= 0 ? p1Idx : 0;
    setSelectedProcessIdx(targetIdx);
    setRequestVector([1, 0, 2]);
  };

  const loadPresetExceedsAvailable = () => {
    // P0 requests [4, 1, 0] when Available A is 3
    setSelectedProcessIdx(0);
    setRequestVector([4, 1, 0]);
  };

  const loadPresetExceedsNeed = () => {
    // P0 requests [8, 0, 0] when Need A is 7
    setSelectedProcessIdx(0);
    setRequestVector([8, 0, 0]);
  };

  return (
    <div className="page-container">
      {/* Top Presets Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--bg-card)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Quick Benchmark Scenarios:
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Load Standard Viva & Textbook Requests
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadPresetTC3} title="TC3 Classic Unsafe Test: P4 requests [3, 3, 0]">
            <ShieldAlert size={14} color="var(--rose-500)" />
            <span>TC3: P4 [3, 3, 0] (Unsafe Denied)</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={loadPresetSafe} title="Safe Request: P1 requests [1, 0, 2]">
            <ShieldCheck size={14} color="var(--emerald-600)" />
            <span>Safe: P1 [1, 0, 2] (Granted)</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={loadPresetExceedsAvailable} title="Request exceeds Available: P0 requests [4, 1, 0]">
            <Clock size={14} color="var(--electric-blue)" />
            <span>Wait: P0 [4, 1, 0] (Exceeds Avail)</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={loadPresetExceedsNeed} title="Invalid Request: P0 requests [8, 0, 0]">
            <AlertOctagon size={14} color="var(--amber-600)" />
            <span>Invalid: P0 [8, 0, 0] (Exceeds Need)</span>
          </button>
        </div>
      </div>

      {/* Request Form & Interactive Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Input Panel */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Craft Resource Request</h3>
              <p className="card-subtitle">Select process and specify instances to request</p>
            </div>
            <VectorBadge label="System Available" values={systemState.available} resources={systemState.resources} variant="emerald" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Process Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Requesting Process:
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--input-border)',
                  backgroundColor: 'var(--input-bg)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--input-text)',
                }}
                value={selectedProcessIdx}
                onChange={(e) => setSelectedProcessIdx(parseInt(e.target.value, 10))}
              >
                {systemState.processes.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.name} (Allocation: [{systemState.allocation[idx]?.join(', ')}], Remaining Need: [{systemState.need[idx]?.join(', ')}])
                  </option>
                ))}
              </select>
            </div>

            {/* Request Vector Number Inputs */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Requested Vector Instances:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {systemState.resources.map((res, rIdx) => {
                  const maxNeed = selectedNeed[rIdx] ?? 0;
                  const curAvail = systemState.available[rIdx] ?? 0;
                  const reqVal = requestVector[rIdx] ?? 0;
                  const exceedsNeed = reqVal > maxNeed;
                  const exceedsAvail = reqVal > curAvail;

                  return (
                    <div
                      key={res.id}
                      style={{
                        flex: '1 1 110px',
                        backgroundColor: 'var(--bg-card-secondary)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: exceedsNeed
                          ? '1px solid var(--rose-500)'
                          : exceedsAvail
                          ? '1px solid var(--amber-500)'
                          : '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Resource {res.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        Need: {maxNeed} | Avail: {curAvail}
                      </div>
                      <input
                        type="number"
                        min="0"
                        className="matrix-input"
                        style={{ width: '100%', marginTop: '0.4rem', textAlign: 'left', paddingLeft: '0.6rem' }}
                        value={reqVal}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          handleVectorChange(rIdx, isNaN(parsed) ? 0 : parsed);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setRequestVector(new Array(systemState.resources.length).fill(0))}
              >
                Clear Inputs
              </button>
              <button className="btn btn-primary" onClick={handleEvaluate}>
                <Send size={16} />
                <span>Evaluate & Execute Request</span>
              </button>
            </div>
          </div>
        </div>

        {/* Evaluation Outcome & Live Check Trace */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Algorithm Decision & Evaluation Trace</h3>
              <p className="card-subtitle">Step-by-step checks A -&gt; B -&gt; C -&gt; D -&gt; E/F</p>
            </div>
            {evaluationResult && (
              <StatusBadge
                status={
                  evaluationResult.decision === 'SAFE_GRANTED'
                    ? 'GRANTED'
                    : evaluationResult.decision === 'UNSAFE_DENIED'
                    ? 'DENIED'
                    : 'WAITING'
                }
              />
            )}
          </div>

          {!evaluationResult ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              Select a process, specify request instances, and click "Evaluate & Execute Request" to view the verification trace.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Check A */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: evaluationResult.needCheckPassed ? 'var(--emerald-50)' : 'var(--rose-50)',
                  border: `1px solid ${evaluationResult.needCheckPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                {evaluationResult.needCheckPassed ? (
                  <CheckCircle2 size={16} color="var(--emerald-600)" />
                ) : (
                  <AlertOctagon size={16} color="var(--rose-600)" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    Check A: Request ≤ Remaining Need
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {evaluationResult.needCheckPassed
                      ? 'PASSED: Request is within maximum declared claim.'
                      : 'FAILED: Request exceeds declared maximum claim (Error Condition).'}
                  </div>
                </div>
              </div>

              {/* Check B */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: evaluationResult.availableCheckPassed ? 'var(--emerald-50)' : 'var(--amber-50)',
                  border: `1px solid ${evaluationResult.availableCheckPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                }}
              >
                {evaluationResult.availableCheckPassed ? (
                  <CheckCircle2 size={16} color="var(--emerald-600)" />
                ) : (
                  <Clock size={16} color="var(--amber-600)" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    Check B: Request ≤ Available Resources
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {evaluationResult.availableCheckPassed
                      ? 'PASSED: Sufficient resources currently free in the system.'
                      : 'FAILED: Exceeds currently available pool. Process must wait.'}
                  </div>
                </div>
              </div>

              {/* Check C & D: Simulation & Safety */}
              {evaluationResult.needCheckPassed && evaluationResult.availableCheckPassed && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: evaluationResult.safetyCheckPassed ? 'var(--emerald-50)' : 'var(--rose-50)',
                    border: `1px solid ${evaluationResult.safetyCheckPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  {evaluationResult.safetyCheckPassed ? (
                    <ShieldCheck size={16} color="var(--emerald-600)" />
                  ) : (
                    <ShieldAlert size={16} color="var(--rose-600)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      Checks C & D: Simulation & Banker's Safety
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {evaluationResult.safetyCheckPassed
                        ? `PASSED: Safe sequence exists: <${evaluationResult.bankerResult?.safeSequence.join(' -> ')}>`
                        : 'FAILED: Temporary allocation leads to UNSAFE state. State rolled back.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation Summary */}
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <strong>Final Verdict:</strong> {evaluationResult.reason}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visible Transaction History Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="var(--electric-blue)" />
            <div>
              <h3 className="card-title">Request Audit & Transaction Log</h3>
              <p className="card-subtitle">Complete chronological record of simulated requests and state mutations</p>
            </div>
          </div>
          {requestHistory.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={clearRequestHistory}>
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {requestHistory.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No transaction records. Execute a request to generate an audit entry.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Process</th>
                  <th>Request Vector</th>
                  <th>Decision</th>
                  <th>Available (Before → After)</th>
                  <th>State Mutated</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {requestHistory.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{tx.timestamp}</td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{tx.processName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      [{tx.requestVector.join(', ')}]
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          tx.decision === 'SAFE_GRANTED'
                            ? 'GRANTED'
                            : tx.decision === 'UNSAFE_DENIED'
                            ? 'DENIED'
                            : 'WAITING'
                        }
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      [{tx.preAvailable.join(', ')}] → [{tx.postAvailable.join(', ')}]
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: tx.stateChanged ? 'var(--emerald-600)' : 'var(--text-muted)',
                        }}
                      >
                        {tx.stateChanged ? 'YES (Committed)' : 'NO (Preserved)'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                      {tx.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
