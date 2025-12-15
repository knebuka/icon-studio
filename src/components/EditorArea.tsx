import React, { useRef, useEffect, useState } from 'react';

const path = window.require('path');

interface Tab {
  id: string;
  type: 'file' | 'search';
  title: string;
  content?: string | string[];
}

interface EditorAreaProps {
  selectedFile: string | null;
  tabs?: Tab[];
  activeTabId?: string | null;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

const EditorArea: React.FC<EditorAreaProps> = ({ 
  selectedFile, 
  tabs = [], 
  activeTabId, 
  onTabChange, 
  onTabClose 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(100);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  useEffect(() => {
    if (activeTab?.type === 'search') return; // 検索タブの場合はキャンバスを使わない

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw sample content
    if (selectedFile) {
      ctx.fillStyle = '#333';
      ctx.font = '16px sans-serif';
      ctx.fillText(`編集中: ${selectedFile}`, 20, 30);
    }
  }, [selectedFile, activeTab]);

  const renderSearchResults = () => {
    if (!activeTab || activeTab.type !== 'search' || !Array.isArray(activeTab.content)) {
      return null;
    }

    return (
      <div className="search-results-tab">
        <div className="search-results-header">
          <h3>{activeTab.title}</h3>
          <p>{activeTab.content.length} 件の画像</p>
        </div>
        <div className="image-grid">
          {activeTab.content.map((filePath, index) => (
            <ImageGridItem 
              key={index} 
              filePath={filePath}
              index={index}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="editor-area">
      <div className="editor-tabs">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`editor-tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange?.(tab.id)}
          >
            <span>{tab.title}</span>
            <button 
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose?.(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {activeTab?.type === 'search' ? (
        renderSearchResults()
      ) : (
        <>
          <div className="editor-controls">
            <button onClick={() => setZoom(Math.max(10, zoom - 10))}>−</button>
            <span className="zoom-level">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(500, zoom + 10))}>+</button>
          </div>
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="editor-canvas"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        </>
      )}
    </div>
  );
};

// 非同期画像読み込みコンポーネント
const ImageGridItem: React.FC<{ filePath: string; index: number }> = ({ filePath, index }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className="image-grid-item">
      {isInView ? (
        <>
          <div className={`image-thumbnail-container ${isLoaded ? 'loaded' : ''}`}>
            {!isLoaded && (
              <div className="image-loading">
                <div className="loading-spinner"></div>
              </div>
            )}
            <img 
              src={`file://${filePath}`} 
              alt={path.basename(filePath)}
              className="image-thumbnail"
              onLoad={handleImageLoad}
              style={{ opacity: isLoaded ? 1 : 0 }}
            />
          </div>
          <div className="image-filename" title={filePath}>
            {path.basename(filePath)}
          </div>
        </>
      ) : (
        <div className="image-thumbnail-container">
          <div className="image-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorArea;
