import React from 'react';
import Editor from '@monaco-editor/react';
import { ChevronLeft, ChevronRight, Code, AlertTriangle } from 'lucide-react';
import { useGapStore } from '../../store/useGapStore';
import { SUPPORTED_LANGUAGES } from '../../shared/constants/languages';

interface CodeEditorPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({ 
  isOpen, 
  onToggle
}) => {
  const inputCode = useGapStore((state) => state.inputCode);
  const setInputCode = useGapStore((state) => state.setInputCode);
  const selectedLanguage = useGapStore((state) => state.selectedLanguage);
  const setSelectedLanguage = useGapStore((state) => state.setSelectedLanguage);

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
        className={`absolute top-1/2 -translate-y-1/2 z-30 w-8 md:w-6 h-12 md:h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 flex items-center justify-center transition-all duration-300 ease-in-out motion-reduce:duration-0 group shadow-lg touch-manipulation min-h-[44px] ${
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

      {/* Collapsed State - Icon Rail with label */}
      {!isOpen && (
        <div className="flex flex-col items-center justify-center gap-2 h-full py-4 pr-8 transition-opacity duration-300 ease-in-out motion-reduce:duration-0">
          <Code className="w-5 h-5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Code</span>
        </div>
      )}

      {/* Expanded State - Full Content */}
      {isOpen && (
        <div className="flex flex-col h-full transition-opacity duration-300 ease-in-out opacity-100">
          <div className="px-4 py-2 border-b border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-200">Original Code</h2>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-slate-500 hover:bg-slate-700 transition-colors"
                title="Select programming language for syntax highlighting (Gap generation only works for JavaScript)"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedLanguage !== 'javascript' && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Gap generation only works for JavaScript. Syntax highlighting will work for {selectedLanguage}.</span>
              </div>
            )}
      </div>
          <div className="flex-1 rounded-b-lg overflow-hidden border-t border-slate-700">
        <Editor
          height="100%"
              language={selectedLanguage}
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
    </div>
  );
};
