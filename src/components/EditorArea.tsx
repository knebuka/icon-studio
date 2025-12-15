import React, { useRef, useEffect, useState } from 'react';

interface EditorAreaProps {
  selectedFile: string | null;
}

const EditorArea: React.FC<EditorAreaProps> = ({ selectedFile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
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
  }, [selectedFile]);

  return (
    <div className="editor-area">
      <div className="editor-tabs">
        {selectedFile && (
          <div className="editor-tab active">
            <span>{selectedFile}</span>
            <button className="tab-close">×</button>
          </div>
        )}
      </div>
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
    </div>
  );
};

export default EditorArea;
