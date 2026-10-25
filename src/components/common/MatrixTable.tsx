import React from 'react';
import type { Process, Resource } from '../../types';

interface MatrixTableProps {
  title: string;
  subtitle?: string;
  processes: Process[];
  resources: Resource[];
  data: number[][];
  editable?: boolean;
  onCellChange?: (pIdx: number, rIdx: number, val: number) => void;
  activeRowIdx?: number;
  highlightedRowIndices?: number[];
  variant?: 'blue' | 'emerald' | 'amber' | 'indigo';
}

export const MatrixTable: React.FC<MatrixTableProps> = ({
  title,
  subtitle,
  processes,
  resources,
  data,
  editable = false,
  onCellChange,
  activeRowIdx,
  highlightedRowIndices = [],
  variant = 'blue',
}) => {
  const getHeaderColor = () => {
    switch (variant) {
      case 'emerald':
        return '#059669';
      case 'amber':
        return '#d97706';
      case 'indigo':
        return '#4f46e5';
      case 'blue':
      default:
        return 'var(--electric-blue)';
    }
  };

  return (
    <div className="table-wrapper" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: getHeaderColor(),
            backgroundColor: 'var(--bg-card-secondary)',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}
        >
          {processes.length} × {resources.length}
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Process</th>
            {resources.map((res) => (
              <th key={res.id} style={{ textAlign: 'center' }}>
                {res.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processes.map((proc, pIdx) => {
            const isActive = activeRowIdx === pIdx;
            const isHighlighted = highlightedRowIndices.includes(pIdx);

            let rowBg = 'transparent';
            if (isActive) {
              rowBg = 'rgba(37, 99, 235, 0.12)';
            } else if (isHighlighted) {
              rowBg = 'rgba(239, 68, 68, 0.14)';
            }

            return (
              <tr
                key={proc.id}
                style={{
                  backgroundColor: rowBg,
                  transition: 'background-color 0.2s ease',
                  borderLeft: isActive
                    ? '3px solid var(--electric-blue)'
                    : isHighlighted
                    ? '3px solid var(--rose-500)'
                    : 'none',
                }}
              >
                <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {proc.name}
                </td>
                {resources.map((res, rIdx) => {
                  const val = data[pIdx]?.[rIdx] ?? 0;
                  return (
                    <td key={res.id} style={{ textAlign: 'center' }}>
                      {editable && onCellChange ? (
                        <input
                          type="number"
                          min="0"
                          className="matrix-input"
                          value={val}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            onCellChange(pIdx, rIdx, isNaN(parsed) ? 0 : Math.max(0, parsed));
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                          }}
                        >
                          {val}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
