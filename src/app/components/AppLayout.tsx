import React from 'react';
import { Header } from './Header';
import { CodeEditorPanel } from './CodeEditorPanel';
import { GappedCodePanel } from './GappedCodePanel';
import { ResultsPanel } from './ResultsPanel';

interface Gap {
  id: number;
  placeholder: string;
  value: string;
}

interface AppLayoutProps {
  originalCode: string;
  gappedCode: string;
  gaps: Gap[];
  onGapChange: (id: number, value: string) => void;
  correctCount: number;
  totalCount: number;
  correctGaps: number[];
  incorrectGaps: number[];
  hint: string;
  onShowAnswers: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  originalCode,
  gappedCode,
  gaps,
  onGapChange,
  correctCount,
  totalCount,
  correctGaps,
  incorrectGaps,
  hint,
  onShowAnswers,
}) => {
  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <Header />
      <div className="flex-1 overflow-hidden p-4">
        <div className="max-w-[1400px] mx-auto h-full flex flex-col">
          <div className="flex-1 grid grid-cols-2 gap-4 mb-4 min-h-0">
            <div className="min-h-0">
              <CodeEditorPanel code={originalCode} />
            </div>
            <div className="min-h-0">
              <GappedCodePanel
                code={gappedCode}
                gaps={gaps}
                onGapChange={onGapChange}
              />
            </div>
          </div>
          <ResultsPanel
            correctCount={correctCount}
            totalCount={totalCount}
            correctGaps={correctGaps}
            incorrectGaps={incorrectGaps}
            hint={hint}
            onShowAnswers={onShowAnswers}
          />
        </div>
      </div>
    </div>
  );
};
