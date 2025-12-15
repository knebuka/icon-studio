import React, { useState, useEffect } from 'react';

interface SidebarProps {
  onFileSelect: (file: string) => void;
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
  const [files] = useState<string[]>(['icon1.svg', 'icon2.svg', 'logo.png']);

  return (
    <div className="file-explorer">
      <div className="section-title">エクスプローラ</div>
      <div className="current-path">
        <span className="path-label">📂</span>
        <span className="path-text">{currentPath}</span>
      </div>
      <div className="file-list">
        {files.map((file, index) => (
          <div
            key={index}
            className="file-item"
            onClick={() => onFileSelect(file)}
          >
            <span className="file-icon">📄</span>
            <span className="file-name">{file}</span>
          </div>
        ))}
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
