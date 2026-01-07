import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Settings } from 'lucide-react';
import { useGapStore } from '../../store/useGapStore';
import { GapSettingsPanel } from './GapSettingsPanel';

export const CodeEditorPanel: React.FC = () => {
  const inputCode = useGapStore((state) => state.inputCode);
  const setInputCode = useGapStore((state) => state.setInputCode);
  const [isGapSettingsOpen, setIsGapSettingsOpen] = useState(false);

  const handleApplyAndGenerate = () => {
    setIsGapSettingsOpen(false);
    useGapStore.getState().generateGaps();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">Original Code</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => useGapStore.getState().generateGaps()}
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
      <div className="flex-1 rounded-b-lg overflow-hidden border border-slate-700">
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
      <GapSettingsPanel
        isOpen={isGapSettingsOpen}
        onClose={() => setIsGapSettingsOpen(false)}
        onApply={handleApplyAndGenerate}
      />
    </div>
  );
};
