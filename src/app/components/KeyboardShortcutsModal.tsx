import React from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-sm pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-base font-semibold text-slate-200">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Ctrl
              </kbd>
              <span className="text-slate-500 text-xs">/</span>
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Cmd
              </kbd>
              <span className="text-slate-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Enter
              </kbd>
            </div>
            <span className="text-slate-300 text-sm">Check answers</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Ctrl
              </kbd>
              <span className="text-slate-500 text-xs">/</span>
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Cmd
              </kbd>
              <span className="text-slate-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                G
              </kbd>
            </div>
            <span className="text-slate-300 text-sm">Generate gaps</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Tab
              </kbd>
            </div>
            <span className="text-slate-300 text-sm">Navigate between gaps</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Ctrl
              </kbd>
              <span className="text-slate-500 text-xs">/</span>
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Cmd
              </kbd>
              <span className="text-slate-500 text-xs">+</span>
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                S
              </kbd>
            </div>
            <span className="text-slate-300 text-sm">Save session</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-300">
                Esc
              </kbd>
            </div>
            <span className="text-slate-300 text-sm">Close modals</span>
          </div>
        </div>
      </div>
    </div>
  );
};
