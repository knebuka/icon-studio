import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  level: 'info' | 'debug' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
}

const DebugLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const { ipcRenderer } = window.require('electron');

  useEffect(() => {
    // Listen for debug logs
    const handleLog = (event: any, log: LogEntry) => {
      setLogs(prev => [...prev, log].slice(-1000)); // Keep last 1000 logs
    };

    ipcRenderer.on('debug-log', handleLog);

    return () => {
      ipcRenderer.removeListener('debug-log', handleLog);
    };
  }, [ipcRenderer]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return 'I';
      case 'debug': return 'D';
      case 'warn': return 'W';
      case 'error': return 'E';
      case 'fatal': return 'F';
      default: return 'L';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { hour12: false });
  };

  return (
    <div className="debug-log">
      <div className="debug-log-header">
        <span className="debug-log-title">DEBUG LOG</span>
        <div className="debug-log-controls">
          <label className="debug-log-checkbox">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>自動スクロール</span>
          </label>
          <button className="debug-log-button" onClick={clearLogs}>
            クリア
          </button>
        </div>
      </div>
      <div className="debug-log-content" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="debug-log-empty">ログがありません</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`debug-log-entry log-${log.level}`}>
              <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
              <span className="log-icon">{getLogIcon(log.level)}</span>
              <span className="log-level">{log.level.toUpperCase()}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugLog;
