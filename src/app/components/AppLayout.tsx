import React from 'react';
import { Header } from './Header';
import { CodeEditorPanel } from './CodeEditorPanel';
import { GappedCodePanel } from './GappedCodePanel';
import { ResultsPanel } from './ResultsPanel';

export const AppLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <Header />
      <div className="flex-1 overflow-hidden p-4">
        <div className="max-w-[1400px] mx-auto h-full flex flex-col">
          <div className="flex-1 grid grid-cols-2 gap-4 mb-4 min-h-0">
            <div className="min-h-0">
              <CodeEditorPanel />
            </div>
            <div className="min-h-0">
              <GappedCodePanel />
            </div>
          </div>
          <ResultsPanel />
        </div>
      </div>
    </div>
  );
};
