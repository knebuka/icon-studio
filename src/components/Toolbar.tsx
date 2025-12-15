import React from 'react';

interface ToolbarProps {}

const Toolbar: React.FC<ToolbarProps> = () => {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button className="toolbar-button" title="新規ファイル">
          <span>📄</span>
        </button>
        <button className="toolbar-button" title="開く">
          <span>📂</span>
        </button>
        <button className="toolbar-button" title="保存">
          <span>💾</span>
        </button>
      </div>
      <div className="toolbar-section">
        <button className="toolbar-button" title="元に戻す">
          <span>↶</span>
        </button>
        <button className="toolbar-button" title="やり直す">
          <span>↷</span>
        </button>
      </div>
      <div className="toolbar-title">Icon Studio</div>
    </div>
  );
};

export default Toolbar;
