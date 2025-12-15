import React, { useState } from 'react';

const { ipcRenderer } = window.require('electron');

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    ipcRenderer.send('window-minimize');
  };

  const handleMaximize = () => {
    ipcRenderer.send('window-maximize');
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    ipcRenderer.send('window-close');
  };

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <div className="app-icon">🎨</div>
        <div className="menu-bar">
          <div className="menu-item">ファイル</div>
          <div className="menu-item">編集</div>
          <div className="menu-item">表示</div>
          <div className="menu-item">ツール</div>
          <div className="menu-item">ヘルプ</div>
        </div>
      </div>
      <div className="title-bar-center">
        <span className="title-text">Icon Studio</span>
      </div>
      <div className="title-bar-right">
        <div className="window-controls">
          <button className="window-control minimize" onClick={handleMinimize} title="最小化">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M 0,5 10,5" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button className="window-control maximize" onClick={handleMaximize} title={isMaximized ? "元に戻す" : "最大化"}>
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M 0,2 0,0 8,0 8,8 6,8" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M 2,2 2,10 10,10 10,2 Z" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M 0,0 0,10 10,10 10,0 Z" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            )}
          </button>
          <button className="window-control close" onClick={handleClose} title="閉じる">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M 0,0 10,10 M 10,0 0,10" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
