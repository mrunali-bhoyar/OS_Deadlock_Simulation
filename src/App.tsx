import React from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewPage } from './pages/OverviewPage';
import { SystemConfigPage } from './pages/SystemConfigPage';
import { BankersPage } from './pages/BankersPage';
import { RequestSimulatorPage } from './pages/RequestSimulatorPage';
import { DeadlockDetectionPage } from './pages/DeadlockDetectionPage';
import { DeadlockPreventionPage } from './pages/DeadlockPreventionPage';
import { ResourceGraphPage } from './pages/ResourceGraphPage';
import { TestLabPage } from './pages/TestLabPage';
import { ResultsAnalysisPage } from './pages/ResultsAnalysisPage';

const PageContent: React.FC = () => {
  const { activePage } = useSystem();

  switch (activePage) {
    case 'overview':
      return <OverviewPage />;
    case 'config':
      return <SystemConfigPage />;
    case 'bankers':
      return <BankersPage />;
    case 'request':
      return <RequestSimulatorPage />;
    case 'detection':
      return <DeadlockDetectionPage />;
    case 'prevention':
      return <DeadlockPreventionPage />;
    case 'rag':
      return <ResourceGraphPage />;
    case 'testlab':
      return <TestLabPage />;
    case 'results':
      return <ResultsAnalysisPage />;
    default:
      return <OverviewPage />;
  }
};

export const AppContent: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="app-main-content">
          <PageContent />
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}

export default App;
