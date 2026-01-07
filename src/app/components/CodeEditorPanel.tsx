import React from 'react';
import Editor from '@monaco-editor/react';
import { useGapStore } from '../../store/useGapStore';

export const CodeEditorPanel: React.FC = () => {
  const inputCode = useGapStore((state) => state.inputCode);
  const setInputCode = useGapStore((state) => state.setInputCode);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">Original Code</h2>
        <button
          onClick={() => useGapStore.getState().generateGaps()}
          className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded border border-slate-600 transition-colors"
        >
          Generate Gaps
        </button>
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
    </div>
  );
};
