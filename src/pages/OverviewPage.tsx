import React from 'react';
import {
  Users,
  Layers,
  Database,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useSystem } from '../context/SystemContext';
import { runBankersSafetyAlgorithm } from '../algorithms/bankersSafety';
import { VectorBadge } from '../components/common/VectorBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const OverviewPage: React.FC = () => {
  const {
    systemState,
    resetToClassicSafe,
    setActivePage,
    requestHistory,
  } = useSystem();

  // Run real-time Banker's safety check on current systemState
  const safetyResult = runBankersSafetyAlgorithm(systemState);

  // Compute live resource metrics
  const totalProcesses = systemState.processes.length;
  const totalResourceTypes = systemState.resources.length;

  // Calculate total allocated per resource
  const allocatedPerResource = systemState.resources.map((_, rIdx) => {
    return systemState.allocation.reduce((sum, row) => sum + (row[rIdx] ?? 0), 0);
  });

  const totalAllocatedInstances = allocatedPerResource.reduce((a, b) => a + b, 0);
  const totalAvailableInstances = systemState.available.reduce((a, b) => a + b, 0);
  const grandTotalInstances = totalAllocatedInstances + totalAvailableInstances;
  const overallUtilizationPct = grandTotalInstances > 0
    ? Math.round((totalAllocatedInstances / grandTotalInstances) * 100)
    : 0;

  // Chart data for Resource Distribution
  const chartData = systemState.resources.map((res, rIdx) => {
    const allocated = allocatedPerResource[rIdx];
    const available = systemState.available[rIdx];
    return {
      name: res.name,
      Allocated: allocated,
      Available: available,
      Total: allocated + available,
    };
  });

  return (
    <div className="page-container">
      {/* Top Action Bar */}
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Scenario:</span>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {systemState.name}
          </h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => resetToClassicSafe()}
            title="Reload Classic Safe Scenario"
          >
            <RotateCcw size={14} />
            <span>Load Demo Scenario</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setActivePage('bankers')}
            title="Open Banker's Algorithm Page"
          >
            <ShieldCheck size={14} />
            <span>Run Safety Check</span>
          </button>

          <button
            className="btn btn-cyan btn-sm"
            onClick={() => setActivePage('request')}
            title="Open Resource Request Simulator"
          >
            <Send size={14} />
            <span>Open Request Simulator</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActivePage('detection')}
            title="Open Deadlock Detection Module"
          >
            <AlertTriangle size={14} />
            <span>Open Deadlock Detection</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => resetToClassicSafe()}
            title="Reset Scenario"
          >
            <RotateCcw size={14} />
            <span>Reset Scenario</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: 'var(--electric-blue)' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Processes</span>
            <span className="stat-value">{totalProcesses}</span>
            <span className="stat-sub">
              {systemState.processes.map((p) => p.name).join(', ')}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--emerald-600)' }}>
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Resource Types</span>
            <span className="stat-value">{totalResourceTypes}</span>
            <span className="stat-sub">
              {systemState.resources.map((r) => r.name).join(', ')}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#faf5ff', color: 'var(--purple-500)' }}>
            <Database size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Available / Allocated</span>
            <span className="stat-value">
              {totalAvailableInstances} / {totalAllocatedInstances}
            </span>
            <span className="stat-sub">System Utilization: {overallUtilizationPct}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              backgroundColor: safetyResult.isSafe ? 'var(--badge-safe-bg)' : 'var(--badge-unsafe-bg)',
              color: safetyResult.isSafe ? 'var(--badge-safe-text)' : 'var(--badge-unsafe-text)',
              border: `1px solid ${safetyResult.isSafe ? 'var(--badge-safe-border)' : 'var(--badge-unsafe-border)'}`,
            }}
          >
            {safetyResult.isSafe ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
          </div>
          <div className="stat-info">
            <span className="stat-label">Safety Status</span>
            <span className="stat-value" style={{ fontSize: '1.2rem', color: safetyResult.isSafe ? 'var(--badge-safe-text)' : 'var(--badge-unsafe-text)' }}>
              {safetyResult.isSafe ? 'SAFE STATE' : 'UNSAFE STATE'}
            </span>
            <span className="stat-sub">
              {safetyResult.isSafe
                ? `<${safetyResult.safeSequence.join(' -> ')}>`
                : 'No safe sequence exists'}
            </span>
          </div>
        </div>
      </div>

      {/* Resource Utilization & Process Allocation Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Recharts Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Resource Utilization Distribution</h3>
              <p className="card-subtitle">Allocated vs. Available instances per resource type</p>
            </div>
            <VectorBadge label="Available" values={systemState.available} resources={systemState.resources} variant="emerald" />
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '0.8rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Bar dataKey="Allocated" fill="var(--electric-blue)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill="var(--cyan-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safe Sequence and Algorithm Summary Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Dijkstra's Banker's Safety Status</h3>
              <p className="card-subtitle">Calculated dynamically from active matrices</p>
            </div>
            <StatusBadge status={safetyResult.isSafe ? 'SAFE' : 'UNSAFE'} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: safetyResult.isSafe ? 'var(--badge-safe-bg)' : 'var(--badge-unsafe-bg)',
                border: `1px solid ${safetyResult.isSafe ? 'var(--badge-safe-border)' : 'var(--badge-unsafe-border)'}`,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: safetyResult.isSafe ? 'var(--badge-safe-text)' : 'var(--badge-unsafe-text)', marginBottom: '0.35rem' }}>
                {safetyResult.isSafe ? 'Safe Sequence Discovered' : 'Safety Violation Warning'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {safetyResult.explanation}
              </div>
            </div>

            {safetyResult.isSafe && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Execution Order:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {safetyResult.safeSequence.map((procName, idx) => (
                    <React.Fragment key={procName}>
                      <span
                        style={{
                          backgroundColor: 'var(--bg-card-secondary)',
                          border: '1px solid var(--electric-blue)',
                          color: 'var(--electric-blue)',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {procName}
                      </span>
                      {idx < safetyResult.safeSequence.length - 1 && (
                        <ArrowRight size={16} color="var(--text-muted)" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => setActivePage('bankers')}
              >
                <span>View Step-by-Step Execution</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Process Allocation Breakdown & Recent Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
        {/* Process Summary Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Process Allocation Summary</h3>
              <p className="card-subtitle">Current Allocation, Maximum demand and remaining Need</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Allocated</th>
                  <th>Maximum</th>
                  <th>Remaining Need</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {systemState.processes.map((proc, pIdx) => {
                  const allocRow = systemState.allocation[pIdx] || [];
                  const maxRow = systemState.maximum[pIdx] || [];
                  const needRow = systemState.need[pIdx] || [];
                  const isInSafeSeq = safetyResult.safeSequence.includes(proc.name);

                  return (
                    <tr key={proc.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{proc.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        [{allocRow.join(', ')}]
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        [{maxRow.join(', ')}]
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--electric-blue)' }}>
                        [{needRow.join(', ')}]
                      </td>
                      <td>
                        {isInSafeSeq ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--emerald-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={12} /> Can Finish
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--amber-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={12} /> Waiting
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Actions & Audit Log */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Algorithm Actions</h3>
              <p className="card-subtitle">Live request simulator audit log</p>
            </div>
            {requestHistory.length > 0 && (
              <span className="badge badge-neutral">{requestHistory.length} Recorded</span>
            )}
          </div>

          {requestHistory.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--slate-400)',
                fontSize: '0.85rem',
              }}
            >
              No simulator requests executed yet. Navigate to the Request Simulator to test allocation requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              {requestHistory.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)',
                    backgroundColor: 'var(--slate-50)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>
                        {tx.processName}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                        Request [{tx.requestVector.join(', ')}]
                      </span>
                    </div>
                    <StatusBadge status={tx.decision.includes('GRANTED') ? 'GRANTED' : tx.decision.includes('DENIED') ? 'DENIED' : 'WAITING'} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                    {tx.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
