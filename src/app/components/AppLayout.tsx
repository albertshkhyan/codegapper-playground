import React, { useState } from 'react';
import { Header } from './Header';
import { CodeEditorPanel } from './CodeEditorPanel';
import { GappedCodePanel } from './GappedCodePanel';
import { ResultsPanel } from './ResultsPanel';

export const AppLayout: React.FC = () => {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <Header />
      <div className="flex-1 overflow-hidden p-4">
        <div className="max-w-[1400px] mx-auto h-full flex flex-col">
          <div className="flex-1 flex gap-4 mb-4 min-h-0">
            <div 
              className="min-h-0 transition-all duration-300 ease-in-out"
              style={{
                width: isLeftPanelOpen ? 'calc(50% - 8px)' : '48px',
                minWidth: isLeftPanelOpen ? 'calc(50% - 8px)' : '48px',
              }}
            >
              <CodeEditorPanel 
                isOpen={isLeftPanelOpen}
                onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                onGenerateGaps={() => setIsLeftPanelOpen(false)}
              />
            </div>
            <div className="flex-1 min-h-0 transition-all duration-300 ease-in-out">
              <GappedCodePanel />
            </div>
          </div>
          <ResultsPanel />
        </div>
      </div>
    </div>
  );
};
