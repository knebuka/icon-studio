import React, { useState } from 'react';
import Sidebar from './Sidebar';
import EditorArea from './EditorArea';
import TitleBar from './TitleBar';
import StatusBar from './StatusBar';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <div className="app">
      <TitleBar />
      <div className="main-container">
        <Sidebar onFileSelect={setSelectedFile} />
        <EditorArea selectedFile={selectedFile} />
      </div>
      <StatusBar />
    </div>
  );
};

export default App;
