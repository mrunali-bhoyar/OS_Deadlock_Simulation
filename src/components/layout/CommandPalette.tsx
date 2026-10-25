import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Activity,
  Sliders,
  ShieldCheck,
  Send,
  AlertTriangle,
  Lock,
  GitBranch,
  FlaskConical,
  BarChart3,
  RotateCcw,
  Sun,
  Moon,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Theme';
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { setActivePage, resetToClassicSafe, theme, toggleTheme } = useSystem();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-overview',
      title: 'Overview Dashboard',
      category: 'Navigation',
      icon: Activity,
      action: () => setActivePage('overview'),
    },
    {
      id: 'nav-config',
      title: 'System Configuration & Matrix Editor',
      category: 'Navigation',
      icon: Sliders,
      action: () => setActivePage('config'),
    },
    {
      id: 'nav-bankers',
      title: "Banker's Safety Algorithm Trace",
      category: 'Navigation',
      icon: ShieldCheck,
      action: () => setActivePage('bankers'),
    },
    {
      id: 'nav-request',
      title: 'Resource Request Simulator & Rollback',
      category: 'Navigation',
      icon: Send,
      action: () => setActivePage('request'),
    },
    {
      id: 'nav-detection',
      title: 'Multiple-Instance Deadlock Detection',
      category: 'Navigation',
      icon: AlertTriangle,
      action: () => setActivePage('detection'),
    },
    {
      id: 'nav-prevention',
      title: "Havender's Hierarchical Prevention Protocol",
      category: 'Navigation',
      icon: Lock,
      action: () => setActivePage('prevention'),
    },
    {
      id: 'nav-rag',
      title: 'Resource Allocation Graph (RAG)',
      category: 'Navigation',
      icon: GitBranch,
      action: () => setActivePage('rag'),
    },
    {
      id: 'nav-testlab',
      title: 'Automated Test Lab (TC1 to TC6)',
      category: 'Navigation',
      icon: FlaskConical,
      action: () => setActivePage('testlab'),
    },
    {
      id: 'nav-results',
      title: 'Results, Analysis & Synthesis',
      category: 'Navigation',
      icon: BarChart3,
      action: () => setActivePage('results'),
    },
    // Quick Actions
    {
      id: 'act-reset',
      title: 'Reset to Classic Safe Baseline (Silberschatz)',
      category: 'Actions',
      icon: RotateCcw,
      action: () => resetToClassicSafe(),
    },
    {
      id: 'act-run-tests',
      title: 'Jump to Automated Test Lab Suite',
      category: 'Actions',
      icon: FlaskConical,
      action: () => setActivePage('testlab'),
    },
    // Theme
    {
      id: 'act-theme',
      title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      category: 'Theme',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette-card" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-wrapper">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or jump to page... (ESC to close)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="command-palette-close-btn" onClick={onClose} aria-label="Close Command Palette">
            <X size={16} />
          </button>
        </div>

        <div className="command-palette-list">
          {filtered.length === 0 ? (
            <div className="command-palette-empty">No matching modules or actions found.</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="command-item-left">
                    <div className="command-item-icon-box">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="command-item-title">{item.title}</div>
                      <div className="command-item-category">{item.category}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="command-item-select-hint">
                      <span>Jump</span>
                      <CornerDownLeft size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-palette-footer-keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span className="command-palette-footer-badge">DeadlockOS Command Engine</span>
        </div>
      </div>
    </div>
  );
};
