import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  FlaskConical,
  Sun,
  Moon,
  Search,
  Command,
  ChevronRight,
  Activity,
  Sliders,
  Send,
  AlertTriangle,
  Lock,
  GitBranch,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { runBankersSafetyAlgorithm } from '../../algorithms/bankersSafety';
import { CommandPalette } from './CommandPalette';
import type { ActivePage } from '../../types';

interface PageMeta {
  title: string;
  category: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
}

const PAGE_META: Record<ActivePage, PageMeta> = {
  overview: {
    title: 'Overview Dashboard',
    category: 'Operational Overview',
    subtitle: 'System health, dynamic allocation distribution & utilization telemetry',
    icon: Activity,
  },
  config: {
    title: 'System Configuration',
    category: 'Operational Overview',
    subtitle: 'Interactive allocation, maximum claim, available & need matrix editor',
    icon: Sliders,
  },
  bankers: {
    title: "Banker's Safety Algorithm",
    category: 'Deadlock Avoidance',
    subtitle: 'Step-by-step animated execution, work vector tracking & safe sequence trace',
    icon: ShieldCheck,
  },
  request: {
    title: 'Resource Request Simulator',
    category: 'Deadlock Avoidance',
    subtitle: 'Safety-guarded request evaluation (Checks A–B–C–D–E/F) & state rollback',
    icon: Send,
  },
  detection: {
    title: 'Deadlock Detection Module',
    category: 'Detection & Recovery',
    subtitle: 'Multiple-instance outstanding request detection & victim process recovery',
    icon: AlertTriangle,
  },
  prevention: {
    title: 'Deadlock Prevention Policy',
    category: 'Detection & Prevention',
    subtitle: "Havender's hierarchical linear resource ordering protocol & mathematical proof",
    icon: Lock,
  },
  rag: {
    title: 'Resource Allocation Graph (RAG)',
    category: 'Graph Topology',
    subtitle: 'Interactive bipartite directed graph of processes, resources, claims & cycles',
    icon: GitBranch,
  },
  testlab: {
    title: 'Automated Test Lab',
    category: 'Verification Suite',
    subtitle: 'Formal unit verification test cases TC1 to TC6 with theoretical baselines',
    icon: FlaskConical,
  },
  results: {
    title: 'Results & Analytical Report',
    category: 'Synthesis & Defense',
    subtitle: 'Analytical outcome matrix, test verification verdicts & syntheses',
    icon: BarChart3,
  },
};

export const Header: React.FC = () => {
  const {
    activePage,
    systemState,
    resetToClassicSafe,
    setActivePage,
    theme,
    toggleTheme,
    testResults,
  } = useSystem();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentMeta = PAGE_META[activePage] || PAGE_META.overview;
  const PageIcon = currentMeta.icon;

  // Run Banker's algorithm live
  const safetyResult = runBankersSafetyAlgorithm(systemState);

  // Count passed tests
  const passedTestsCount = Object.values(testResults).filter((t) => t.passed).length;

  return (
    <>
      <header className="top-header">
        {/* Left: Breadcrumbs & Page Identity */}
        <div className="header-left">
          <div className="header-page-badge">
            <PageIcon size={18} className="header-page-icon" />
          </div>

          <div className="header-title-column">
            <div className="header-breadcrumb">
              <span className="breadcrumb-root">DeadlockOS</span>
              <ChevronRight size={12} className="breadcrumb-chevron" />
              <span className="breadcrumb-category">{currentMeta.category}</span>
              <ChevronRight size={12} className="breadcrumb-chevron" />
              <span className="breadcrumb-current">{currentMeta.title}</span>
            </div>
            <h1 className="page-title">{currentMeta.title}</h1>
          </div>
        </div>

        {/* Center / Right: Live Telemetry & Control Actions */}
        <div className="header-right">
          {/* Quick Search / Command Palette Trigger */}
          <button
            className="command-trigger-btn"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Open Command Palette (Ctrl + K)"
            aria-label="Open Command Palette"
          >
            <Search size={14} className="command-search-icon" />
            <span className="command-trigger-text">Search modules...</span>
            <kbd className="command-shortcut-kbd">
              <Command size={10} />
              <span>K</span>
            </kbd>
          </button>

          {/* Real-time System Vector Badge */}
          <div
            className="header-telemetry-badge"
            title={`Active Available Pool: [${systemState.available.join(', ')}] across ${systemState.resources.length} resource types`}
          >
            <Layers size={13} className="telemetry-badge-icon" />
            <span className="telemetry-badge-text">
              Avail: <strong>[{systemState.available.join(',')}]</strong>
            </span>
          </div>

          {/* Dynamic Safety State Badge */}
          {safetyResult.isSafe ? (
            <div
              className="badge badge-safe header-safety-badge"
              title={`Safe Sequence Discovered: <${safetyResult.safeSequence.join(' → ')}>`}
            >
              <span className="badge-pulse-dot safe" />
              <ShieldCheck size={14} />
              <span className="safety-label">SAFE STATE</span>
            </div>
          ) : (
            <div
              className="badge badge-unsafe header-safety-badge"
              title={safetyResult.explanation || 'No safe sequence exists'}
            >
              <span className="badge-pulse-dot unsafe" />
              <ShieldAlert size={14} />
              <span className="safety-label">UNSAFE STATE</span>
            </div>
          )}

          <div className="header-actions-divider" />

          {/* Theme Switcher */}
          <button
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun size={14} color="#f59e0b" />
            ) : (
              <Moon size={14} color="var(--electric-blue)" />
            )}
            <span className="action-btn-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Test Lab Direct Jump */}
          <button
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={() => setActivePage('testlab')}
            title="Open Automated Verification Test Lab"
          >
            <FlaskConical size={14} />
            <span className="action-btn-text">Test Lab</span>
            {passedTestsCount > 0 && (
              <span className="header-test-pill">{passedTestsCount}/6</span>
            )}
          </button>

          {/* Reset Scenario Button */}
          <button
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={resetToClassicSafe}
            title="Reset system to classic safe textbook baseline"
          >
            <RotateCcw size={14} />
            <span className="action-btn-text">Reset</span>
          </button>
        </div>
      </header>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};
