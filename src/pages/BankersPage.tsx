import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  FastForward,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { runBankersSafetyAlgorithm } from '../algorithms/bankersSafety';
import { MatrixTable } from '../components/common/MatrixTable';
import { VectorBadge } from '../components/common/VectorBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const BankersPage: React.FC = () => {
  const { systemState } = useSystem();

  // Run the algorithm on the active system state to produce the step trace
  const bankerResult = runBankersSafetyAlgorithm(systemState);
  const steps = bankerResult.steps;

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(1200);

  const timerRef = useRef<number | null>(null);

  // Safely clamp step index if state changes
  useEffect(() => {
    if (currentStepIdx >= steps.length) {
      setCurrentStepIdx(Math.max(0, steps.length - 1));
    }
  }, [steps.length, currentStepIdx]);

  // Autoplay animation effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, playbackSpeedMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeedMs, steps.length]);

  const activeStep = steps[currentStepIdx] || steps[0];

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    setCurrentStepIdx(steps.length - 1);
  };

  const togglePlay = () => {
    if (currentStepIdx >= steps.length - 1) {
      setCurrentStepIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  return (
    <div className="page-container">
      {/* Top Playback Control Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Execution Step:
          </span>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-card-secondary)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--electric-blue)',
            }}
          >
            {currentStepIdx + 1} / {steps.length}
          </span>
        </div>

        {/* Playback Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleRestart} title="Restart to Step 1">
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            title="Previous Step"
          >
            <SkipBack size={14} />
            <span>Prev</span>
          </button>

          <button
            className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'} btn-sm`}
            onClick={togglePlay}
            title={isPlaying ? 'Pause Animation' : 'Play Step-by-Step Animation'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : 'Play Animation'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleNext}
            disabled={currentStepIdx === steps.length - 1}
            title="Next Step"
          >
            <SkipForward size={14} />
            <span>Next</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleComplete}
            disabled={currentStepIdx === steps.length - 1}
            title="Jump to Final Outcome"
          >
            <FastForward size={14} />
            <span>Complete</span>
          </button>

          {/* Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Speed:</span>
            <select
              style={{
                fontSize: '0.78rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
              }}
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(parseInt(e.target.value, 10))}
            >
              <option value={2000}>0.5x (Slow)</option>
              <option value={1200}>1.0x (Normal)</option>
              <option value={600}>2.0x (Fast)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vectors Status Row: Work Vector, Finish Vector, Safe Sequence */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Current Work Vector [W]</span>
            <div style={{ marginTop: '0.35rem' }}>
              <VectorBadge
                values={activeStep.work}
                resources={systemState.resources}
                variant="emerald"
              />
            </div>
            <span className="stat-sub">Initialized to Available, updated when processes complete</span>
          </div>
        </div>

        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-info" style={{ width: '100%' }}>
            <span className="stat-label">Finish Array [Finish[i] === true]</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              {systemState.processes.map((proc, idx) => {
                const isFinished = activeStep.finish[idx];
                return (
                  <div
                    key={proc.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isFinished ? 'var(--badge-safe-bg)' : 'var(--bg-card-secondary)',
                      border: `1px solid ${isFinished ? 'var(--badge-safe-border)' : 'var(--border-color)'}`,
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: isFinished ? 'var(--badge-safe-text)' : 'var(--text-primary)' }}>
                      {proc.name}:
                    </span>
                    <span style={{ fontWeight: 600, color: isFinished ? 'var(--badge-safe-text)' : 'var(--text-muted)' }}>
                      {isFinished ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="stat-sub" style={{ marginTop: '0.3rem' }}>
              All Finish[i] must be TRUE for the state to be proven SAFE.
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Safe Execution Sequence</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem' }}>
              {activeStep.safeSequence.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  None completed yet
                </span>
              ) : (
                activeStep.safeSequence.map((pName, idx) => (
                  <React.Fragment key={pName}>
                    <span
                      style={{
                        padding: '0.2rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--badge-waiting-bg)',
                        color: 'var(--badge-waiting-text)',
                        border: '1px solid var(--badge-waiting-border)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {pName}
                    </span>
                    {idx < activeStep.safeSequence.length - 1 && (
                      <ArrowRight size={12} color="var(--text-muted)" />
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
            <span className="stat-sub">Dynamic sequence of guaranteed completion</span>
          </div>
        </div>
      </div>

      {/* Step Trace Explanation Card */}
      <div
        className={`step-card ${
          activeStep.type === 'ALLOCATE_WORK' || activeStep.type === 'FINISHED_SAFE'
            ? 'success'
            : activeStep.type === 'UNSAFE_STUCK'
            ? 'failure'
            : 'warning'
        }`}
        style={{ marginBottom: '1.75rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeStep.type === 'FINISHED_SAFE' ? (
              <CheckCircle2 size={20} color="var(--emerald-600)" />
            ) : activeStep.type === 'UNSAFE_STUCK' ? (
              <XCircle size={20} color="var(--rose-600)" />
            ) : (
              <Info size={20} color="var(--electric-blue)" />
            )}
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Step {activeStep.stepNumber}: {activeStep.type.replace('_', ' ')}
            </span>
          </div>

          <StatusBadge
            status={
              activeStep.type === 'FINISHED_SAFE'
                ? 'SAFE'
                : activeStep.type === 'UNSAFE_STUCK'
                ? 'UNSAFE'
                : 'WAITING'
            }
          />
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {activeStep.explanation}
        </p>

        {activeStep.needCheck && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-card-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
            }}
          >
            <div>
              <strong>Evaluation Formula:</strong> Need[i] ≤ Work
            </div>
            <div style={{ marginTop: '0.2rem' }}>
              Need = [{activeStep.needCheck.need.join(', ')}] | Work = [{activeStep.needCheck.work.join(', ')}]
            </div>
            <div style={{ marginTop: '0.2rem', color: activeStep.needCheck.satisfied ? 'var(--emerald-600)' : 'var(--amber-600)', fontWeight: 600 }}>
              Result: {activeStep.needCheck.satisfied ? 'SATISFIED (Process can execute)' : 'UNSATISFIED (Need exceeds available Work)'}
            </div>
          </div>
        )}
      </div>

      {/* Matrices with Active Process Row Highlighted */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <MatrixTable
          title="Allocation Matrix"
          subtitle="Resources currently held by each process"
          processes={systemState.processes}
          resources={systemState.resources}
          data={systemState.allocation}
          activeRowIdx={activeStep.processIndex}
          variant="blue"
        />

        <MatrixTable
          title="Remaining Need Matrix"
          subtitle="Need[i][j] compared against current Work vector"
          processes={systemState.processes}
          resources={systemState.resources}
          data={systemState.need}
          activeRowIdx={activeStep.processIndex}
          variant="emerald"
        />
      </div>

      {/* Theory & Key Insight Banner */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--electric-blue)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <HelpCircle size={22} color="var(--electric-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Theoretical Distinction: Safe State vs Unsafe State vs Deadlock
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.6 }}>
              A state is <strong>SAFE</strong> if there exists at least one order in which all processes can obtain their maximum demands, finish, and release resources.
              An <strong>UNSAFE state is NOT necessarily deadlocked</strong>; rather, it is a state that offers no mathematical guarantee against deadlock if all processes simultaneously demand their peak maximum claims. Avoidance algorithms like Banker's proactively reject transitions into unsafe states.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
