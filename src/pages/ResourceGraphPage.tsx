import React, { useState } from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { runDeadlockDetection } from '../algorithms/deadlockDetection';

export const ResourceGraphPage: React.FC = () => {
  const { systemState, detectionState } = useSystem();

  const [activeDataSource, setActiveDataSource] = useState<'bankers' | 'detection'>('bankers');
  const [filterMode, setFilterMode] = useState<'all' | 'allocation' | 'request'>('all');
  const [selectedNode, setSelectedNode] = useState<{ type: 'process' | 'resource'; id: string; name: string } | null>(null);

  // Active dataset
  const processes = activeDataSource === 'bankers' ? systemState.processes : detectionState.processes;
  const resources = activeDataSource === 'bankers' ? systemState.resources : detectionState.resources;
  const allocation = activeDataSource === 'bankers' ? systemState.allocation : detectionState.allocation;
  const request = activeDataSource === 'bankers' ? systemState.need : detectionState.request;

  // Run detection on active dataset to know if any deadlock exists
  const detectionResult = runDeadlockDetection(
    activeDataSource === 'bankers'
      ? {
          processes: systemState.processes,
          resources: systemState.resources,
          allocation: systemState.allocation,
          request: systemState.need,
          available: systemState.available,
        }
      : detectionState
  );

  // Canvas layout coordinates
  // Place Processes on the Left column, Resources on the Right column (or concentric circle)
  const svgWidth = 840;
  const svgHeight = Math.max(500, Math.max(processes.length, resources.length) * 110 + 60);

  const processCoords = processes.map((p, idx) => {
    const spacing = (svgHeight - 80) / Math.max(1, processes.length - 1 || 1);
    const y = processes.length === 1 ? svgHeight / 2 : 40 + idx * spacing;
    return { id: p.id, name: p.name, x: 160, y };
  });

  const resourceCoords = resources.map((r, idx) => {
    const spacing = (svgHeight - 80) / Math.max(1, resources.length - 1 || 1);
    const y = resources.length === 1 ? svgHeight / 2 : 40 + idx * spacing;
    return { id: r.id, name: r.name, x: 680, y, totalInstances: r.totalInstances };
  });

  // Collect edges
  interface Edge {
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: 'allocation' | 'request';
    label: string;
    isDeadlocked: boolean;
  }

  const edges: Edge[] = [];

  // 1. Allocation Edges: Resource -> Process
  if (filterMode === 'all' || filterMode === 'allocation') {
    allocation.forEach((row, pIdx) => {
      row.forEach((val, rIdx) => {
        if (val > 0) {
          const pCoord = processCoords[pIdx];
          const rCoord = resourceCoords[rIdx];
          if (pCoord && rCoord) {
            edges.push({
              id: `alloc-${rCoord.id}-${pCoord.id}`,
              fromX: rCoord.x - 30,
              fromY: rCoord.y,
              toX: pCoord.x + 28,
              toY: pCoord.y,
              type: 'allocation',
              label: `${val}`,
              isDeadlocked: detectionResult.deadlockedProcessIds.includes(pCoord.id),
            });
          }
        }
      });
    });
  }

  // 2. Request Edges: Process -> Resource
  if (filterMode === 'all' || filterMode === 'request') {
    request.forEach((row, pIdx) => {
      row.forEach((val, rIdx) => {
        if (val > 0) {
          const pCoord = processCoords[pIdx];
          const rCoord = resourceCoords[rIdx];
          if (pCoord && rCoord) {
            edges.push({
              id: `req-${pCoord.id}-${rCoord.id}`,
              fromX: pCoord.x + 28,
              fromY: pCoord.y,
              toX: rCoord.x - 30,
              toY: rCoord.y,
              type: 'request',
              label: `${val}`,
              isDeadlocked: detectionResult.deadlockedProcessIds.includes(pCoord.id),
            });
          }
        }
      });
    });
  }

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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Resource Allocation Graph (RAG)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Directed bipartite graph of processes and resource types. Allocation edges (R → P) and Request edges (P → R).
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {/* Data Source Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Source:</span>
            <select
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                fontWeight: 600,
              }}
              value={activeDataSource}
              onChange={(e) => setActiveDataSource(e.target.value as 'bankers' | 'detection')}
            >
              <option value="bankers">Banker's Safety Scenario</option>
              <option value="detection">Deadlock Detection Scenario</option>
            </select>
          </div>

          {/* Edge Filter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter:</span>
            <select
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                fontWeight: 600,
              }}
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'allocation' | 'request')}
            >
              <option value="all">All Edges (Alloc & Req)</option>
              <option value="allocation">Allocation Edges Only (R → P)</option>
              <option value="request">Request Edges Only (P → R)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Graph Legend & Status Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.75rem 1.25rem',
          backgroundColor: 'var(--bg-card-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--blue-50)', border: '2px solid var(--electric-blue)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Process Node</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: 'var(--emerald-50)', border: '2px solid var(--emerald-600)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Resource Type Node</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 22, height: 2, backgroundColor: 'var(--electric-blue)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Allocation Edge (R → P)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 22, height: 2, borderTop: '2px dashed var(--amber-500)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Request Edge (P → R)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {detectionResult.isDeadlocked ? (
            <span style={{ color: 'var(--rose-600)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={15} /> Active Cycle / Deadlock in Scenario
            </span>
          ) : (
            <span style={{ color: 'var(--emerald-600)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={15} /> Deadlock-Free Configuration
            </span>
          )}
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div
        className="card"
        style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          overflowX: 'auto',
          marginBottom: '1.75rem',
        }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ display: 'block', margin: '0 auto', userSelect: 'none' }}
        >
          {/* Arrowhead Markers */}
          <defs>
            <marker
              id="arrow-alloc"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--electric-blue)" />
            </marker>

            <marker
              id="arrow-req"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--amber-500)" />
            </marker>

            <marker
              id="arrow-deadlock"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--rose-500)" />
            </marker>
          </defs>

          {/* Render Directed Edges */}
          {edges.map((edge) => {
            const isAlloc = edge.type === 'allocation';
            const markerId = edge.isDeadlocked ? 'arrow-deadlock' : isAlloc ? 'arrow-alloc' : 'arrow-req';
            const strokeColor = edge.isDeadlocked
              ? 'var(--rose-500)'
              : isAlloc
              ? 'var(--electric-blue)'
              : 'var(--amber-500)';

            // Midpoint for edge text label
            const midX = (edge.fromX + edge.toX) / 2;
            const midY = (edge.fromY + edge.toY) / 2;

            // Curved cubic bezier path for visual elegance
            const controlOffset = isAlloc ? -25 : 25;
            const pathData = `M ${edge.fromX} ${edge.fromY} Q ${midX} ${midY + controlOffset} ${edge.toX} ${edge.toY}`;

            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={edge.isDeadlocked ? 2.5 : 1.8}
                  strokeDasharray={isAlloc ? 'none' : '5,4'}
                  markerEnd={`url(#${markerId})`}
                  opacity={0.8}
                />
                {/* Instance Count Badge on Edge */}
                <rect
                  x={midX - 10}
                  y={midY + controlOffset / 2 - 9}
                  width={20}
                  height={18}
                  rx={4}
                  fill="var(--bg-card)"
                  stroke={strokeColor}
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={midY + controlOffset / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                  fill={strokeColor}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Render Process Nodes (Left Column) */}
          {processCoords.map((proc) => {
            const isDeadlocked = detectionResult.deadlockedProcessIds.includes(proc.id);
            const isSelected = selectedNode?.id === proc.id;

            return (
              <g
                key={proc.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedNode({ type: 'process', id: proc.id, name: proc.name })}
              >
                <circle
                  cx={proc.x}
                  cy={proc.y}
                  r={26}
                  fill={isDeadlocked ? 'var(--badge-deadlocked-bg)' : isSelected ? 'var(--blue-50)' : 'var(--bg-card)'}
                  stroke={isDeadlocked ? 'var(--rose-500)' : 'var(--electric-blue)'}
                  strokeWidth={isSelected ? 3 : 2}
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
                />
                <text
                  x={proc.x}
                  y={proc.y + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="var(--font-mono)"
                  fill={isDeadlocked ? 'var(--rose-500)' : 'var(--text-primary)'}
                >
                  {proc.name}
                </text>
                <text
                  x={proc.x - 40}
                  y={proc.y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="600"
                  fill="var(--text-muted)"
                >
                  Process
                </text>
              </g>
            );
          })}

          {/* Render Resource Nodes (Right Column) */}
          {resourceCoords.map((res) => {
            const isSelected = selectedNode?.id === res.id;

            return (
              <g
                key={res.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedNode({ type: 'resource', id: res.id, name: res.name })}
              >
                <rect
                  x={res.x - 30}
                  y={res.y - 25}
                  width={60}
                  height={50}
                  rx={8}
                  fill={isSelected ? 'var(--emerald-50)' : 'var(--bg-card)'}
                  stroke="var(--emerald-600)"
                  strokeWidth={isSelected ? 3 : 2}
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
                />
                <text
                  x={res.x}
                  y={res.y - 3}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="var(--font-mono)"
                  fill="var(--emerald-600)"
                >
                  {res.name}
                </text>
                <text
                  x={res.x}
                  y={res.y + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--text-muted)"
                >
                  {res.totalInstances ? `(${res.totalInstances} inst)` : 'Resource'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* RAG Academic Rule Explanation Card */}
      <div className="card" style={{ borderLeft: '4px solid var(--cyan-500)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={22} color="var(--cyan-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Graph Theory Criteria: Cycles vs Deadlocks
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.6 }}>
              In a system where <strong>every resource type has only one single instance</strong>, a cycle in the Resource Allocation Graph is both a <strong>necessary and sufficient condition</strong> for deadlock.
              However, in <strong>multiple-instance systems</strong> (like the ones simulated here), a cycle is a <em>necessary</em> condition but <strong>NOT sufficient</strong>: other processes holding instances of the cycled resource may finish and break the wait. Hence, matrix-based detection algorithms must be executed to mathematically prove deadlock.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
