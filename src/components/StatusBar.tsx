import React from 'react';

const StatusBar: React.FC = () => {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span>準備完了</span>
      </div>
      <div className="status-right">
        <span>位置: 0, 0</span>
        <span>ズーム: 100%</span>
      </div>
    </div>
  );
};

export default StatusBar;
