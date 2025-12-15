import React from 'react';

interface StatusBarProps {
  isAdmin?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ isAdmin = false }) => {
  return (
    <div className={`status-bar ${isAdmin ? 'status-bar-admin' : ''}`}>
      <div className="status-left">
        <span>{isAdmin ? '🔧 管理者モード' : '準備完了'}</span>
      </div>
      <div className="status-right">
        <span>位置: 0, 0</span>
        <span>ズーム: 100%</span>
      </div>
    </div>
  );
};

export default StatusBar;
