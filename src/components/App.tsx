import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import EditorArea from './EditorArea';
import TitleBar from './TitleBar';
import StatusBar from './StatusBar';
import DebugLog from './DebugLog';

const { ipcRenderer } = window.require('electron');

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'explorer' | 'search' | 'logs' | 'settings'>('explorer');
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);

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
        />
        <EditorArea selectedFile={selectedFile} />
      </div>
      {isAdmin && <DebugLog />}
      <StatusBar isAdmin={isAdmin} />
    </div>
  );
};

export default App;
