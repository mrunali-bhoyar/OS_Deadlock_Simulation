import React from 'react';
import {
  Activity,
  Sliders,
  ShieldCheck,
  Send,
  AlertTriangle,
  Lock,
  GitBranch,
  FlaskConical,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Radio,
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import type { ActivePage } from '../../types';

interface NavItem {
  id: ActivePage;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  badgeVariant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, isSidebarCollapsed, toggleSidebar, systemState } = useSystem();

  const sections: NavSection[] = [
    {
      title: 'Operational Overview',
      items: [
        { id: 'overview', label: 'Overview Dashboard', icon: Activity },
        { id: 'config', label: 'System Configuration', icon: Sliders },
      ],
    },
    {
      title: 'Deadlock Avoidance',
      items: [
        { id: 'bankers', label: "Banker's Algorithm", icon: ShieldCheck, badge: 'Dijkstra', badgeVariant: 'emerald' },
        { id: 'request', label: 'Request Simulator', icon: Send, badge: 'Live', badgeVariant: 'blue' },
      ],
    },
    {
      title: 'Detection & Prevention',
      items: [
        { id: 'detection', label: 'Deadlock Detection', icon: AlertTriangle, badge: 'Detect', badgeVariant: 'amber' },
        { id: 'prevention', label: 'Deadlock Prevention', icon: Lock, badge: 'Havender', badgeVariant: 'cyan' },
        { id: 'rag', label: 'Resource Graph (RAG)', icon: GitBranch, badge: 'Graph', badgeVariant: 'blue' },
      ],
    },
    {
      title: 'Verification & Defense',
      items: [
        { id: 'testlab', label: 'Test Lab (TC1–TC6)', icon: FlaskConical, badge: 'TC1–6', badgeVariant: 'emerald' },
        { id: 'results', label: 'Results & Synthesis', icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-header">
        {!isSidebarCollapsed ? (
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <Cpu size={22} color="#ffffff" />
            </div>
            <div className="brand-text-container">
              <div className="brand-title-row">
                <span className="brand-title">DeadlockOS</span>
                <span className="brand-version-badge">PRO</span>
              </div>
              <div className="brand-status-row">
                <span className="status-indicator-dot" />
                <span className="brand-subtitle">Real-Time Kernel</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="brand-icon-wrapper" style={{ margin: '0 auto' }}>
            <Cpu size={20} color="#ffffff" />
          </div>
        )}

        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="nav-section-group">
            {!isSidebarCollapsed && (
              <div className="nav-section-title">{section.title}</div>
            )}
            <div className="nav-section-items">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActivePage(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={17} className="nav-icon" />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="nav-item-label">{item.label}</span>
                        {item.badge && (
                          <span className={`nav-badge badge-${item.badgeVariant || 'blue'}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer with Live Telemetry */}
      {!isSidebarCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-telemetry-card">
            <div className="telemetry-header">
              <Radio size={13} className="telemetry-live-icon" />
              <span className="telemetry-title">Engine Status: Active</span>
            </div>
            <div className="telemetry-details">
              <span>{systemState.processes.length} Processes</span>
              <span className="telemetry-divider">•</span>
              <span>{systemState.resources.length} Types</span>
              <span className="telemetry-divider">•</span>
              <span>Avail [{systemState.available.join(',')}]</span>
            </div>
          </div>
          <div className="sidebar-footer-sub">
            <span>Operating Systems Lab Activity</span>
          </div>
        </div>
      )}
    </aside>
  );
};
