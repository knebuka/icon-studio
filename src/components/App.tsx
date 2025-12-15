import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SecondarySidebar from './SecondarySidebar';
import EditorArea from './EditorArea';
import TitleBar from './TitleBar';
import StatusBar from './StatusBar';
import DebugLog from './DebugLog';

interface Tab {
  id: string;
  type: 'file' | 'search';
  title: string;
  content?: string | string[];
}

const { ipcRenderer } = window.require('electron');

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'explorer' | 'search' | 'logs' | 'settings'>('explorer');
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState(300);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const handleStartSearchTab = (searchQuery: string): string => {
    const newTab: Tab = {
      id: `search-${Date.now()}`,
      type: 'search',
      title: `検索: ${searchQuery}`,
      content: []
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    return newTab.id;
  };

  const handleUpdateSearchTab = (tabId: string, results: string[]) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, content: results }
        : tab
    ));
  };

  const handleAddToSearchTab = (tabId: string, newResults: string[]) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId && Array.isArray(tab.content)
        ? { ...tab, content: [...tab.content, ...newResults] }
        : tab
    ));
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[tabs.length - 2].id : null);
    }
  };

  useEffect(() => {
    // Check if running as admin
    ipcRenderer.invoke('is-admin').then((admin: boolean) => {
      setIsAdmin(admin);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+F for search
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setActivePanel('search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="app">
      <TitleBar />
      <div className="main-container">
        <Sidebar 
          onFileSelect={setSelectedFile} 
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          width={sidebarWidth}
          onResize={setSidebarWidth}
          onStartSearchTab={handleStartSearchTab}
          onUpdateSearchTab={handleUpdateSearchTab}
          onAddToSearchTab={handleAddToSearchTab}
        />
        <EditorArea 
          selectedFile={selectedFile}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onTabClose={handleCloseTab}
        />
        <SecondarySidebar 
          width={secondarySidebarWidth}
          onResize={setSecondarySidebarWidth}
        />
      </div>
      {isAdmin && <DebugLog />}
      <StatusBar isAdmin={isAdmin} />
    </div>
  );
};

export default App;
