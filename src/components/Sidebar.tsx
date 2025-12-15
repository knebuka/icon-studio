import React, { useState, useEffect } from 'react';

const fs = window.require('fs');
const path = window.require('path');

interface SidebarProps {
  onFileSelect: (file: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  isExpanded?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onFileSelect }) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'logs' | 'settings'>('explorer');

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
          title="エクスプローラ"
        >
          📁
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
          title="システムログ"
        >
          📋
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          title="システム設定"
        >
          ⚙️
        </button>
      </div>
      <div className="sidebar-content">
        {activeTab === 'explorer' && <FileExplorer onFileSelect={onFileSelect} />}
        {activeTab === 'logs' && <SystemLogs />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
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
