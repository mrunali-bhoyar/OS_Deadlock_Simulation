import React, { useState } from 'react';
import {
  Lock,
  XCircle,
  CheckCircle2,
  BookOpen,
  Scale,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { evaluateResourceOrderingRequest } from '../algorithms/deadlockPrevention';
import { StatusBadge } from '../components/common/StatusBadge';

export const DeadlockPreventionPage: React.FC = () => {
  const { systemState, resourceOrdering, setResourceOrdering } = useSystem();

  const [heldResourceIds, setHeldResourceIds] = useState<string[]>(['R0']);
  const [requestedResourceId, setRequestedResourceId] = useState<string>('R2');

  const toggleHeldResource = (resId: string) => {
    if (heldResourceIds.includes(resId)) {
      setHeldResourceIds(heldResourceIds.filter((id) => id !== resId));
    } else {
      setHeldResourceIds([...heldResourceIds, resId]);
    }
  };

  const handleRankChange = (resId: string, newRank: number) => {
    setResourceOrdering({
      ...resourceOrdering,
      [resId]: Math.max(1, newRank),
    });
  };

  // Run evaluation
  const result = evaluateResourceOrderingRequest(
    resourceOrdering,
    systemState.resources,
    heldResourceIds,
    requestedResourceId
  );

  return (
    <div className="page-container">
      {/* Header Info */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Lock size={22} color="var(--electric-blue)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Havender's Hierarchical Resource Ordering Protocol
          </h2>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.6 }}>
          Deadlock prevention systematically negates one of the four necessary Coffman conditions.
          By assigning a strict 1-to-1 numbering function <code style={{ fontFamily: 'var(--font-mono)' }}>F: R → ℕ</code> to all resource types and requiring that processes request resources only in strictly increasing order, the <strong>Circular Wait</strong> condition is mathematically eliminated.
        </p>
      </div>

      {/* Resource Ordering Hierarchy Configurator */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Resource Type Priority Ordering Function F(R)</h3>
            <p className="card-subtitle">Define the global linear ordering of resources across the operating system</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
          {systemState.resources.map((res) => {
            const currentRank = resourceOrdering[res.id] ?? 1;
            return (
              <div
                key={res.id}
                style={{
                  backgroundColor: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Resource {res.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{res.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rank F =</span>
                  <input
                    type="number"
                    min="1"
                    className="matrix-input"
                    value={currentRank}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      handleRankChange(res.id, isNaN(val) ? 1 : val);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Hierarchy Line */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--blue-50)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--electric-blue)' }}>
            System Hierarchy:
          </span>
          {[...systemState.resources]
            .sort((a, b) => (resourceOrdering[a.id] ?? 0) - (resourceOrdering[b.id] ?? 0))
            .map((r, idx, arr) => (
              <React.Fragment key={r.id}>
                <span
                  style={{
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {r.name} (F={resourceOrdering[r.id] ?? 1})
                </span>
                {idx < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>&lt;</span>}
              </React.Fragment>
            ))}
        </div>
      </div>

      {/* Interactive Prevention Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Held Resources Selection */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Process Current State & Request</h3>
              <p className="card-subtitle">Select resources currently held by the process and requested resource</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Currently Held Resources:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {systemState.resources.map((res) => {
                  const isHeld = heldResourceIds.includes(res.id);
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => toggleHeldResource(res.id)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isHeld ? '1px solid var(--electric-blue)' : '1px solid var(--border-color)',
                        backgroundColor: isHeld ? 'var(--blue-50)' : 'var(--bg-card)',
                        color: isHeld ? 'var(--electric-blue)' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {res.name} (F={resourceOrdering[res.id] ?? 1}) {isHeld ? '✓ Held' : '+ Hold'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Target Requested Resource:
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--input-border)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
                value={requestedResourceId}
                onChange={(e) => setRequestedResourceId(e.target.value)}
              >
                {systemState.resources.map((res) => (
                  <option key={res.id} value={res.id}>
                    Resource {res.name} (Priority Rank F = {resourceOrdering[res.id] ?? 1})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Verification Result Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Policy Verification Verdict</h3>
              <p className="card-subtitle">Enforcing F(Requested) &gt; max(F(Held))</p>
            </div>
            <StatusBadge status={result.isAllowed ? 'PASSED' : 'FAILED'} label={result.isAllowed ? 'ALLOWED' : 'ORDER VIOLATION'} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: result.isAllowed ? 'var(--emerald-50)' : 'var(--rose-50)',
                border: `1px solid ${result.isAllowed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                {result.isAllowed ? (
                  <CheckCircle2 size={18} color="var(--emerald-600)" />
                ) : (
                  <XCircle size={18} color="var(--rose-600)" />
                )}
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: result.isAllowed ? 'var(--emerald-600)' : 'var(--rose-600)',
                  }}
                >
                  {result.isAllowed ? 'Request Complies with Hierarchy' : 'Request Order Violation Detected'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {result.message}
              </p>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong>Highest Held Resource Rank:</strong> {result.highestHeldRank} ({result.highestHeldResource?.name || 'None'})
              </div>
              <div style={{ marginTop: '0.2rem' }}>
                <strong>Requested Resource Rank:</strong> {result.requestedRank} ({result.requestedResource.name})
              </div>
              <div style={{ marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                Rule: {result.requestedRank} &gt; {result.highestHeldRank} → {result.isAllowed ? 'VALID' : 'INVALID'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Proof & Trade-Offs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Proof */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Mathematical Proof against Circular Wait</h3>
              <p className="card-subtitle">Contradiction theorem</p>
            </div>
            <BookOpen size={16} color="var(--electric-blue)" />
          </div>
          <pre
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {result.mathematicalProof}
          </pre>
        </div>

        {/* Trade-Off Analysis */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Engineering Trade-Offs</h3>
              <p className="card-subtitle">Advantages and drawbacks of prevention vs avoidance</p>
            </div>
            <Scale size={16} color="var(--cyan-500)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--emerald-600)', marginBottom: '0.3rem' }}>
                ✓ Advantages:
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                {result.tradeOffAnalysis.pros.map((pro, idx) => (
                  <li key={idx}>{pro}</li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--rose-600)', marginBottom: '0.3rem' }}>
                ✗ Drawbacks:
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                {result.tradeOffAnalysis.cons.map((con, idx) => (
                  <li key={idx}>{con}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
