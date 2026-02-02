import React from 'react';
import { Info } from 'lucide-react';

export const KeyboardShortcutsFooter: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="Keyboard shortcuts and about"
      className="w-full pt-4 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm rounded-lg px-4 py-3 hidden md:flex items-start justify-between gap-6 shadow-lg z-10"
    >
      <div className="flex-1">
        <div className="font-semibold text-base text-slate-200 mb-3">Keyboard Shortcuts</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                Ctrl
              </kbd>
              <span className="text-slate-500 text-xs">/</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                Cmd
              </kbd>
              <span className="text-slate-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                Enter
              </kbd>
            </div>
            <span className="text-slate-300 ml-2 text-xs">Check answers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                Ctrl
              </kbd>
              <span className="text-slate-500 text-xs">/</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                Cmd
              </kbd>
              <span className="text-slate-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                G
              </kbd>
            </div>
            <span className="text-slate-300 ml-2 text-xs">Generate gaps</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
              Tab
            </kbd>
            <span className="text-slate-300 ml-2 text-xs">Navigate between gaps</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                Ctrl
              </kbd>
              <span className="text-slate-500 text-xs">/</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                Cmd
              </kbd>
              <span className="text-slate-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
                S
              </kbd>
            </div>
            <span className="text-slate-300 ml-2 text-xs">Save session</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-200 shadow-sm">
              Esc
            </kbd>
            <span className="text-slate-300 ml-2 text-xs">Close modals</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-end text-right">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-400" />
          <div className="font-semibold text-base text-slate-200">About</div>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p className="text-slate-400">
            CodeGapper Playground is an interactive learning tool that helps you master programming by filling in code gaps.
          </p>
          <p className="text-slate-400">
            Generate fill-in-the-blank exercises from your JavaScript code using AST parsing.
          </p>
          <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-slate-700">
            <a
              href="https://github.com/albertshkhyan/codegapper-playground"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition-colors text-xs"
            >
              GitHub
            </a>
            <a
              href="https://buymeacoffee.com/albertahkhyan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition-colors text-xs"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
