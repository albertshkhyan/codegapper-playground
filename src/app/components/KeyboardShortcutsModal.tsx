import React from 'react';
import { Info, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 md:hidden"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-sm max-h-[100dvh] overflow-hidden flex flex-col m-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-semibold text-slate-200">Shortcuts &amp; About</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-200 p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="font-semibold text-sm text-slate-200 mb-2">Keyboard Shortcuts</div>
            <p className="text-slate-400 text-xs mb-3">On desktop use these; on mobile use the buttons above.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Ctrl</kbd>
                <span className="text-slate-500 text-xs">/</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Cmd</kbd>
                <span className="text-slate-500 text-xs">+</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Enter</kbd>
                <span className="text-slate-300 ml-2 text-xs">Check answers</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Ctrl</kbd>
                <span className="text-slate-500 text-xs">/</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Cmd</kbd>
                <span className="text-slate-500 text-xs">+</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">G</kbd>
                <span className="text-slate-300 ml-2 text-xs">Generate gaps</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Tab</kbd>
                <span className="text-slate-300 ml-2 text-xs">Navigate between gaps</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Ctrl</kbd>
                <span className="text-slate-500 text-xs">/</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Cmd</kbd>
                <span className="text-slate-500 text-xs">+</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">S</kbd>
                <span className="text-slate-300 ml-2 text-xs">Save session</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-200">Esc</kbd>
                <span className="text-slate-300 ml-2 text-xs">Close modals</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-slate-400" />
              <div className="font-semibold text-sm text-slate-200">About</div>
            </div>
            <p className="text-slate-400 text-xs">
              CodeGapper Playground helps you learn by filling in code gaps. Generate exercises from your JavaScript code.
            </p>
            <div className="flex gap-4 mt-3 pt-3 border-t border-slate-700">
              <a
                href="https://github.com/albertshkhyan/codegapper-playground"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-200 text-xs min-h-[44px] flex items-center"
              >
                GitHub
              </a>
              <a
                href="https://buymeacoffee.com/albertahkhyan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-200 text-xs min-h-[44px] flex items-center"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
