import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { validateSystemState } from '../algorithms/validation';
import { MatrixTable } from '../components/common/MatrixTable';
import { VectorBadge } from '../components/common/VectorBadge';

export const SystemConfigPage: React.FC = () => {
  const {
    systemState,
    updateAllocationCell,
    updateMaximumCell,
    updateAvailableCell,
    addProcess,
    removeProcess,
    addResource,
    removeResource,
    resetToClassicSafe,
    exportSystemStateJSON,
    importSystemStateJSON,
  } = useSystem();

  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });
  const [showJsonModal, setShowJsonModal] = useState(false);

  // Live validation
  const validation = validateSystemState(systemState);

  const handleExport = () => {
    const jsonStr = exportSystemStateJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deadlock-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setImportStatus({ type: 'error', message: 'JSON string cannot be empty.' });
      return;
    }
    const res = importSystemStateJSON(importText);
    if (res.success) {
      setImportStatus({ type: 'success', message: 'Configuration successfully imported and validated!' });
      setTimeout(() => {
        setShowJsonModal(false);
        setImportStatus({ type: 'idle' });
      }, 1200);
    } else {
      setImportStatus({ type: 'error', message: res.error || 'Failed to import JSON.' });
    }
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            System Matrix & Resource Editor
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Modify Allocation, Maximum and Available vectors. Need matrix is recalculated automatically in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => addProcess()}>
            <Plus size={14} />
            <span>Add Process</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => removeProcess(systemState.processes.length - 1)}
            disabled={systemState.processes.length <= 1}
          >
            <Trash2 size={14} />
            <span>Remove Process</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => addResource()}>
            <Plus size={14} />
            <span>Add Resource</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => removeResource(systemState.resources.length - 1)}
            disabled={systemState.resources.length <= 1}
          >
            <Trash2 size={14} />
            <span>Remove Resource</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            <Download size={14} />
            <span>Export JSON</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => setShowJsonModal(true)}>
            <Upload size={14} />
            <span>Import JSON</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={resetToClassicSafe}>
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Validation Banner */}
      {!validation.isValid && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--rose-50)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} color="var(--rose-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--rose-600)' }}>
              Configuration Validation Errors:
            </div>
            <ul style={{ fontSize: '0.8rem', color: 'var(--slate-700)', marginTop: '0.3rem', paddingLeft: '1.25rem' }}>
              {validation.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Available Resources Vector Editor */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Available Vector [W]</h3>
            <p className="card-subtitle">Currently unallocated instances available for immediate dispatch</p>
          </div>
          <VectorBadge label="Current Available" values={systemState.available} resources={systemState.resources} variant="emerald" />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          {systemState.resources.map((res, rIdx) => (
            <div
              key={res.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-card-secondary)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Resource {res.name}:
              </div>
              <input
                type="number"
                min="0"
                className="matrix-input"
                value={systemState.available[rIdx] ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updateAvailableCell(rIdx, isNaN(val) ? 0 : Math.max(0, val));
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>instances</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix Editor Grid: Allocation, Maximum, Need */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Allocation Matrix */}
        <MatrixTable
          title="Allocation Matrix"
          subtitle="Currently held resource instances per process"
          processes={systemState.processes}
          resources={systemState.resources}
          data={systemState.allocation}
          editable={true}
          onCellChange={updateAllocationCell}
          variant="blue"
        />

        {/* Maximum Matrix */}
        <MatrixTable
          title="Maximum Claim Matrix"
          subtitle="Maximum declared resource instances each process may require"
          processes={systemState.processes}
          resources={systemState.resources}
          data={systemState.maximum}
          editable={true}
          onCellChange={updateMaximumCell}
          variant="amber"
        />

        {/* Need Matrix (Automatically Derived) */}
        <MatrixTable
          title="Need Matrix (Derived)"
          subtitle="Need[i][j] = Maximum[i][j] - Allocation[i][j]"
          processes={systemState.processes}
          resources={systemState.resources}
          data={systemState.need}
          editable={false}
          variant="emerald"
        />
      </div>

      {/* JSON Import/Export Modal */}
      {showJsonModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '640px',
              width: '100%',
              backgroundColor: 'var(--bg-card)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="card-header">
              <div>
                <h3 className="card-title">Import System Configuration JSON</h3>
                <p className="card-subtitle">Paste a valid SystemState configuration JSON object below</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowJsonModal(false);
                  setImportStatus({ type: 'idle' });
                }}
              >
                Close
              </button>
            </div>

            <textarea
              style={{
                width: '100%',
                height: '240px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                resize: 'vertical',
                outline: 'none',
              }}
              placeholder={`{\n  "processes": [...],\n  "resources": [...],\n  "allocation": [...],\n  "maximum": [...],\n  "available": [...]\n}`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />

            {importStatus.type === 'error' && (
              <div style={{ marginTop: '0.75rem', color: 'var(--rose-600)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={14} />
                <span>{importStatus.message}</span>
              </div>
            )}

            {importStatus.type === 'success' && (
              <div style={{ marginTop: '0.75rem', color: 'var(--emerald-600)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} />
                <span>{importStatus.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setImportText(exportSystemStateJSON())}
              >
                Load Current State
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleImportSubmit}>
                Validate & Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
