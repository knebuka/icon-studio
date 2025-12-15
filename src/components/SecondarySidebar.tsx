import React, { useState, useEffect, useRef } from 'react';

interface SecondarySidebarProps {
  width?: number;
  onResize?: (width: number) => void;
}

const SecondarySidebar: React.FC<SecondarySidebarProps> = ({ width = 300, onResize }) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'midjourney'>('gemini');
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !onResize || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
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

  return (
    <div className="secondary-sidebar" ref={sidebarRef} style={{ width: `${width}px` }}>
      <div 
        className="secondary-sidebar-resize-handle"
        onMouseDown={() => setIsResizing(true)}
      />
      <div className="secondary-sidebar-tabs">
        <button
          className={`secondary-sidebar-tab ${activeTab === 'gemini' ? 'active' : ''}`}
          onClick={() => setActiveTab('gemini')}
          title="Gemini"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
        <button
          className={`secondary-sidebar-tab ${activeTab === 'midjourney' ? 'active' : ''}`}
          onClick={() => setActiveTab('midjourney')}
          title="Midjourney"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
        </button>
      </div>
      <div className="secondary-sidebar-content">
        {activeTab === 'gemini' && <GeminiPanel />}
        {activeTab === 'midjourney' && <MidjourneyPanel />}
      </div>
    </div>
  );
};

const GeminiPanel: React.FC = () => {
  return (
    <div className="secondary-panel">
      <div className="section-title">Gemini</div>
      <div className="panel-content">
        <p style={{ color: '#858585', fontSize: '13px' }}>Gemini panel content</p>
      </div>
    </div>
  );
};

const MidjourneyPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [model, setModel] = useState('6.1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [history, setHistory] = useState<Array<{ 
    prompt: string; 
    timestamp: string; 
    imageUrl?: string;
    id?: string;
    hash?: string;
    status: 'generating' | 'completed' | 'failed';
    error?: string;
  }>>([]);

  const { ipcRenderer } = window.require('electron');

  useEffect(() => {
    // Listen for progress updates
    const handleProgress = (event: any, data: { uri: string; progress: string }) => {
      setProgress(data.progress);
    };

    ipcRenderer.on('midjourney-progress', handleProgress);

    return () => {
      ipcRenderer.removeListener('midjourney-progress', handleProgress);
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress('0%');
    
    const newEntry = {
      prompt: prompt,
      timestamp: new Date().toLocaleString('ja-JP'),
      status: 'generating' as const
    };
    
    setHistory(prev => [newEntry, ...prev]);
    
    try {
      const result = await ipcRenderer.invoke('midjourney-generate', prompt, {
        aspectRatio,
        model
      });

      if (result.success) {
        setHistory(prev => prev.map((item, index) => 
          index === 0 
            ? { 
                ...item, 
                status: 'completed' as const, 
                imageUrl: result.imageUrl,
                id: result.id,
                hash: result.hash
              }
            : item
        ));
        setPrompt('');
      } else {
        setHistory(prev => prev.map((item, index) => 
          index === 0 
            ? { ...item, status: 'failed' as const, error: result.error }
            : item
        ));
      }
    } catch (error: any) {
      setHistory(prev => prev.map((item, index) => 
        index === 0 
          ? { ...item, status: 'failed' as const, error: error.message }
          : item
      ));
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="secondary-panel">
      <div className="section-title">Midjourney</div>
      <div className="panel-content">
        <div className="mj-input-group">
          <label className="mj-label">プロンプト</label>
          <textarea
            className="mj-textarea"
            placeholder="画像生成のプロンプトを入力..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={4}
            disabled={isGenerating}
          />
        </div>

        <div className="mj-settings">
          <div className="mj-setting-group">
            <label className="mj-label">アスペクト比</label>
            <select 
              className="mj-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              disabled={isGenerating}
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
            </select>
          </div>

          <div className="mj-setting-group">
            <label className="mj-label">モデル</label>
            <select 
              className="mj-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isGenerating}
            >
              <option value="6.1">v6.1</option>
              <option value="6.0">v6.0</option>
              <option value="5.2">v5.2</option>
              <option value="niji-6">Niji 6</option>
            </select>
          </div>
        </div>

        {isGenerating && progress && (
          <div className="mj-progress">
            <div className="mj-progress-bar">
              <div className="mj-progress-fill" style={{ width: progress }}></div>
            </div>
            <div className="mj-progress-text">{progress}</div>
          </div>
        )}

        <button 
          className="mj-generate-button"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? '生成中...' : '生成'}
        </button>

        {history.length > 0 && (
          <div className="mj-history">
            <div className="mj-history-title">履歴</div>
            <div className="mj-history-list">
              {history.map((item, index) => (
                <div key={index} className={`mj-history-item mj-status-${item.status}`}>
                  <div className="mj-history-prompt">{item.prompt}</div>
                  <div className="mj-history-time">{item.timestamp}</div>
                  {item.status === 'generating' && (
                    <div className="mj-history-status">生成中...</div>
                  )}
                  {item.status === 'failed' && (
                    <div className="mj-history-error">失敗: {item.error}</div>
                  )}
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.prompt} className="mj-history-image" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondarySidebar;
