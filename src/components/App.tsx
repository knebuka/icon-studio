import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
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
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const handleOpenSearchTab = (searchQuery: string, results: string[]) => {
    const newTab: Tab = {
      id: `search-${Date.now()}`,
      type: 'search',
      title: `検索: ${searchQuery}`,
      content: results
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
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
          onOpenSearchTab={handleOpenSearchTab}
        />
        <EditorArea 
          selectedFile={selectedFile}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onTabClose={handleCloseTab}
        />
      </div>
      {isAdmin && <DebugLog />}
      <StatusBar isAdmin={isAdmin} />
    </div>
  );
};

export default App;
