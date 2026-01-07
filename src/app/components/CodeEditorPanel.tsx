import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Settings, ChevronLeft, ChevronRight, Code } from 'lucide-react';
import { useGapStore } from '../../store/useGapStore';
import { GapSettingsPanel } from './GapSettingsPanel';

interface CodeEditorPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onGenerateGaps?: () => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({ 
  isOpen, 
  onToggle,
  onGenerateGaps 
}) => {
  const inputCode = useGapStore((state) => state.inputCode);
  const setInputCode = useGapStore((state) => state.setInputCode);
  const [isGapSettingsOpen, setIsGapSettingsOpen] = useState(false);

  const handleApplyAndGenerate = () => {
    setIsGapSettingsOpen(false);
    useGapStore.getState().generateGaps();
    onGenerateGaps?.();
  };

  const handleGenerateGaps = () => {
    useGapStore.getState().generateGaps();
    onGenerateGaps?.();
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-900 rounded-lg border border-slate-700 overflow-visible">
      {/* Toggle Button - Positioned on right edge, half outside when open, fully inside when collapsed */}
      <button
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`absolute top-1/2 -translate-y-1/2 z-30 w-6 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center transition-all duration-300 ease-in-out group shadow-lg ${
          isOpen 
            ? 'right-0 translate-x-1/2 rounded-r-md' 
            : 'right-0 translate-x-0 rounded-md'
        }`}
        aria-label={isOpen ? 'Collapse left panel' : 'Expand left panel'}
        aria-expanded={isOpen}
        tabIndex={0}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-100 transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-100 transition-colors" />
        )}
      </button>

      {/* Collapsed State - Icon Rail */}
      {!isOpen && (
        <div className="flex flex-col items-center justify-center h-full py-4 pr-8 transition-opacity duration-300 ease-in-out">
          <Code className="w-5 h-5 text-slate-400" />
        </div>
      )}

      {/* Expanded State - Full Content */}
      {isOpen && (
        <div className="flex flex-col h-full transition-opacity duration-300 ease-in-out opacity-100">
          <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between bg-slate-900">
            <h2 className="text-sm font-medium text-slate-200">Original Code</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateGaps}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors"
              >
                Generate Gaps
              </button>
              <button
                onClick={() => setIsGapSettingsOpen(true)}
                className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded transition-colors flex items-center gap-1.5"
                title="Configure gap generation"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Gap Settings</span>
              </button>
            </div>
          </div>
          <div className="flex-1 rounded-b-lg overflow-hidden border-t border-slate-700">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={inputCode}
              onChange={(value) => setInputCode(value || '')}
              theme="vs-dark"
              options={{
                readOnly: false,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: 'monospace',
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      )}

      <GapSettingsPanel
        isOpen={isGapSettingsOpen}
        onClose={() => setIsGapSettingsOpen(false)}
        onApply={handleApplyAndGenerate}
      />
    </div>
  );
};
