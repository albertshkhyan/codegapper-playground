import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorPanelProps {
  code: string;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({ code }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-200">Original Code</h2>
      </div>
      <div className="flex-1 rounded-b-lg overflow-hidden border border-slate-700">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
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
