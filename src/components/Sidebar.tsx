import React, { useState, useEffect, useRef } from 'react';

const fs = window.require('fs');
const path = window.require('path');

interface SidebarProps {
  onFileSelect: (file: string) => void;
  activePanel?: 'explorer' | 'search' | 'logs' | 'settings';
  onPanelChange?: (panel: 'explorer' | 'search' | 'logs' | 'settings') => void;
  width?: number;
  onResize?: (width: number) => void;
  onOpenSearchTab?: (query: string, results: string[]) => void;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  isExpanded?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onFileSelect, activePanel, onPanelChange, width = 300, onResize, onOpenSearchTab }) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'search' | 'logs' | 'settings'>(activePanel || 'explorer');
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !onResize) return;
      const newWidth = e.clientX - 48;
      if (newWidth >= 200 && newWidth <= 600) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize]);

  useEffect(() => {
    if (activePanel) {
      setActiveTab(activePanel);
    }
  }, [activePanel]);

  const handleTabChange = (tab: 'explorer' | 'search' | 'logs' | 'settings') => {
    setActiveTab(tab);
    if (onPanelChange) {
      onPanelChange(tab);
    }
  };

  return (
    <div className="sidebar" ref={sidebarRef} style={{ width: `${width}px` }}>
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => handleTabChange('explorer')}
          title="エクスプローラ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleTabChange('search')}
          title="検索"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => handleTabChange('logs')}
          title="システムログ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
            <line x1="9" y1="11" x2="15" y2="11"/>
          </svg>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabChange('settings')}
          title="システム設定"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
        </button>
      </div>
      <div className="sidebar-content">
        {activeTab === 'explorer' && <FileExplorer onFileSelect={onFileSelect} />}
        {activeTab === 'search' && <SearchPanel onFileSelect={onFileSelect} onOpenSearchTab={onOpenSearchTab} />}
        {activeTab === 'logs' && <SystemLogs />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
      <div 
        className="sidebar-resize-handle"
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  );
};

const FileExplorer: React.FC<{ onFileSelect: (file: string) => void }> = ({ onFileSelect }) => {
  const defaultPath = 'I:\\design★';
  const [currentPath, setCurrentPath] = useState(defaultPath);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = (dirPath: string): FileNode[] => {
    try {
      if (!fs.existsSync(dirPath)) {
        setError(`パスが存在しません: ${dirPath}`);
        return [];
      }

      const items = fs.readdirSync(dirPath);
      const nodes: FileNode[] = [];

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        try {
          const stats = fs.statSync(fullPath);
          nodes.push({
            name: item,
            path: fullPath,
            isDirectory: stats.isDirectory(),
            isExpanded: false,
            children: []
          });
        } catch (err) {
          // Skip files we can't access
          console.warn(`Cannot access: ${fullPath}`);
        }
      }

      // Sort: directories first, then files
      nodes.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });

      setError(null);
      return nodes;
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
      return [];
    }
  };

  useEffect(() => {
    const nodes = loadDirectory(currentPath);
    setFileTree(nodes);
  }, [currentPath]);

  const toggleDirectory = (node: FileNode) => {
    if (!node.isDirectory) {
      onFileSelect(node.path);
      return;
    }

    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n.path === node.path) {
          const isExpanded = !n.isExpanded;
          return {
            ...n,
            isExpanded,
            children: isExpanded ? loadDirectory(n.path) : []
          };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateTree(n.children) };
        }
        return n;
      });
    };

    setFileTree(updateTree(fileTree));
  };

  const renderFileNode = (node: FileNode, level: number = 0): JSX.Element => {
    const icon = node.isDirectory 
      ? (node.isExpanded ? '📂' : '📁')
      : getFileIcon(node.name);

    return (
      <div key={node.path}>
        <div
          className="file-item"
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => toggleDirectory(node)}
        >
          {node.isDirectory && (
            <span className="expand-icon">
              {node.isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="file-icon">{icon}</span>
          <span className="file-name">{node.name}</span>
        </div>
        {node.isExpanded && node.children && (
          <div className="file-children">
            {node.children.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFileIcon = (fileName: string): string => {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.svg': return '🎨';
      case '.png': case '.jpg': case '.jpeg': case '.gif': return '🖼️';
      case '.ico': return '🔲';
      case '.pdf': return '📕';
      case '.txt': return '📝';
      case '.json': return '⚙️';
      default: return '📄';
    }
  };

  const handlePathChange = () => {
    const newPath = prompt('新しいパスを入力してください:', currentPath);
    if (newPath && newPath.trim()) {
      setCurrentPath(newPath.trim());
    }
  };

  return (
    <div className="file-explorer">
      <div className="section-title">エクスプローラ</div>
      <div className="current-path" onClick={handlePathChange} title="クリックしてパスを変更">
        <span className="path-label">📂</span>
        <span className="path-text">{currentPath}</span>
      </div>
      {error && (
        <div className="explorer-error">{error}</div>
      )}
      <div className="file-list">
        {fileTree.map(node => renderFileNode(node))}
      </div>
    </div>
  );
};

const SearchPanel: React.FC<{ onFileSelect: (file: string) => void; onOpenSearchTab?: (query: string, results: string[]) => void }> = ({ onFileSelect, onOpenSearchTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPath, setSearchPath] = useState('I:\\design★');
  const [searchResults, setSearchResults] = useState<Array<{ file: string; line: number; content: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showInTab, setShowInTab] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { ipcRenderer } = window.require('electron');

  useEffect(() => {
    // フォーカスを検索入力欄に合わせる
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // メインプロセスで検索を実行
      const results = await ipcRenderer.invoke('search-files', searchPath, searchQuery);
      setSearchResults(results);
      
      // タブで開くが有効な場合、新しいタブを開く
      if (showInTab && onOpenSearchTab && results.length > 0) {
        const filePaths = results.map((r: any) => r.file);
        onOpenSearchTab(searchQuery, filePaths);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (filePath: string) => {
    onFileSelect(filePath);
  };

  return (
    <div className="search-panel">
      <div className="search-header">
        <div className="section-title">検索</div>
        <label className="search-toggle">
          <input
            type="checkbox"
            checked={showInTab}
            onChange={(e) => setShowInTab(e.target.checked)}
          />
          <span className="search-toggle-label">タブで開く</span>
        </label>
      </div>
      <div className="search-input-group">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="検索ワードを入力..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="search-button" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? '⏳' : '🔍'}
        </button>
      </div>
      <div className="search-path-group">
        <input
          type="text"
          className="search-path-input"
          placeholder="検索パス"
          value={searchPath}
          onChange={(e) => setSearchPath(e.target.value)}
        />
      </div>
      <div className="search-results">
        {searchResults.length > 0 && (
          <div className="search-results-header">
            {searchResults.length} 件の結果
          </div>
        )}
        <div className="search-results-list">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="search-result-item"
              onClick={() => handleResultClick(result.file)}
              title={result.file}
            >
              <span className="search-result-icon">📄</span>
              <span className="search-result-filename">{path.basename(result.file)}</span>
            </div>
          ))}
        </div>
        {!isSearching && searchResults.length === 0 && searchQuery && (
          <div className="search-no-results">結果が見つかりませんでした</div>
        )}
      </div>
    </div>
  );
};

const SystemLogs: React.FC = () => {
  const [logs] = useState<Array<{ time: string; message: string; level: 'info' | 'warning' | 'error' }>>([
    { time: '12:00:01', message: 'アプリケーション起動', level: 'info' },
    { time: '12:00:05', message: 'ファイル読み込み完了', level: 'info' },
    { time: '12:01:23', message: 'キャンバス初期化', level: 'info' }
  ]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="system-logs">
      <div className="section-title">システムログ</div>
      <div className="log-list">
        {logs.map((log, index) => (
          <div key={index} className={`log-item ${log.level}`}>
            <span className="log-icon">{getLevelIcon(log.level)}</span>
            <div className="log-content">
              <span className="log-time">{log.time}</span>
              <span className="log-message">{log.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    gridSize: 20,
    autoSave: true,
    language: 'ja'
  });

  return (
    <div className="system-settings">
      <div className="section-title">システム設定</div>
      <div className="settings-list">
        <div className="setting-group">
          <div className="setting-label">テーマ</div>
          <select 
            className="setting-input"
            value={settings.theme}
            onChange={(e) => setSettings({...settings, theme: e.target.value})}
          >
            <option value="dark">ダーク</option>
            <option value="light">ライト</option>
          </select>
        </div>
        
        <div className="setting-group">
          <div className="setting-label">グリッドサイズ</div>
          <input 
            type="number"
            className="setting-input"
            value={settings.gridSize}
            onChange={(e) => setSettings({...settings, gridSize: Number(e.target.value)})}
          />
        </div>
        
        <div className="setting-group">
          <div className="setting-label">自動保存</div>
          <label className="setting-checkbox">
            <input 
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
            />
            <span>有効</span>
          </label>
        </div>
        
        <div className="setting-group">
          <div className="setting-label">言語</div>
          <select 
            className="setting-input"
            value={settings.language}
            onChange={(e) => setSettings({...settings, language: e.target.value})}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
