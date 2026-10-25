import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { ALL_TEST_CASES } from '../testLab/testCases';
import { StatusBadge } from '../components/common/StatusBadge';
import type { TestCaseResult } from '../types';

export const TestLabPage: React.FC = () => {
  const { testResults, setTestResult, setAllTestResults, setActivePage } = useSystem();
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);

  // Compute test metrics
  const totalTests = ALL_TEST_CASES.length;
  const passedCount = Object.values(testResults).filter((r) => r.passed).length;
  const failedCount = Object.values(testResults).filter((r) => r.status === 'FAILED').length;
  const executedCount = passedCount + failedCount;

  const handleRunSingleTest = (testId: string) => {
    const testCase = ALL_TEST_CASES.find((t) => t.id === testId);
    if (!testCase) return;

    const result = testCase.run();
    setTestResult(testId, result);
  };

  const handleRunAllTests = () => {
    setIsRunningAll(true);
    const newResults: Record<string, TestCaseResult> = {};

    ALL_TEST_CASES.forEach((testCase) => {
      const res = testCase.run();
      newResults[testCase.id] = res;
    });

    setAllTestResults(newResults);
    setIsRunningAll(false);
  };

  const handleResetTests = () => {
    setAllTestResults({});
  };

  return (
    <div className="page-container">
      {/* Top Banner and Master Run All Button */}
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
            <FlaskConical size={22} color="var(--electric-blue)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Automated OS Test Laboratory (TC1 to TC6)
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Formal verification test suite with independently computed algorithm outcomes and mathematical proof checks.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleResetTests}>
            <RotateCcw size={14} />
            <span>Reset Test Results</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleRunAllTests}
            disabled={isRunningAll}
          >
            <Play size={16} />
            <span>{isRunningAll ? 'Executing Suite...' : 'Run All 6 Tests'}</span>
          </button>

          <button
            className="btn btn-cyan btn-sm"
            onClick={() => setActivePage('results')}
          >
            <span>View Analysis Report</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Test Execution Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Test Cases</span>
            <span className="stat-value">{totalTests}</span>
            <span className="stat-sub">TC1 through TC6</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Executed / Pending</span>
            <span className="stat-value">
              {executedCount} / {totalTests - executedCount}
            </span>
            <span className="stat-sub">
              {executedCount === totalTests ? 'All tests executed' : 'Tests pending execution'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Passed Tests</span>
            <span className="stat-value" style={{ color: 'var(--emerald-600)' }}>
              {passedCount}
            </span>
            <span className="stat-sub">
              {executedCount > 0 ? `${Math.round((passedCount / executedCount) * 100)}% pass rate` : 'Awaiting run'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Failed Tests</span>
            <span className="stat-value" style={{ color: failedCount > 0 ? 'var(--rose-600)' : 'var(--text-muted)' }}>
              {failedCount}
            </span>
            <span className="stat-sub">{failedCount === 0 ? 'Zero failures' : 'Issues detected'}</span>
          </div>
        </div>
      </div>

      {/* Individual Test Cards TC1 to TC6 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {ALL_TEST_CASES.map((tc) => {
          const result = testResults[tc.id];
          const isRun = !!result;
          const isPassed = result?.passed ?? false;

          return (
            <div
              key={tc.id}
              className="card"
              style={{
                borderLeft: isRun
                  ? isPassed
                    ? '4px solid var(--emerald-500)'
                    : '4px solid var(--rose-500)'
                  : '4px solid var(--border-color)',
              }}
            >
              {/* Card Header */}
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--navy-900)',
                      color: 'var(--cyan-400)',
                    }}
                  >
                    {tc.id}
                  </span>
                  <div>
                    <h3 className="card-title" style={{ fontSize: '1.02rem' }}>
                      {tc.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tc.category}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <StatusBadge status={isRun ? (isPassed ? 'PASSED' : 'FAILED') : 'NOT_RUN'} />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRunSingleTest(tc.id)}
                  >
                    <Play size={13} />
                    <span>Run Test</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                {tc.description}
              </p>

              {/* Test Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
                    Initial State:
                  </strong>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: 1.5, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {result?.initialStateSummary || 'Classic or Dedicated matrices'}
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
                    Input / Action:
                  </strong>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: 1.5, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {result?.inputAction || 'Execute algorithm verification routine'}
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
                    Expected Outcome:
                  </strong>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.5, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {result?.expectedResult || 'Independent theoretical baseline'}
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
                    Actual Computed Result:
                  </strong>
                  <div
                    style={{
                      color: isRun ? (isPassed ? 'var(--emerald-600)' : 'var(--rose-600)') : 'var(--text-muted)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      lineHeight: 1.5,
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    }}
                  >
                    {result?.computedResult || 'Not yet executed'}
                  </div>
                </div>
              </div>

              {/* Explanation & Verification Outcome */}
              {isRun && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isPassed ? 'var(--emerald-50)' : 'var(--rose-50)',
                    border: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>{result.explanation}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                    {result.executionTimeMs} ms
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
