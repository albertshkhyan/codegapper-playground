import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Plus, Save, FolderOpen, Download, Heart, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useGapStore } from '../../store/useGapStore';
import { useSessionStore } from '../../store/useSessionStore';
import { SessionModal } from './SessionModal';
import type { SessionData } from '../../utils/sessionStorage';

const SessionList = lazy(() => import('./SessionList').then((m) => ({ default: m.SessionList })));
import codeGapperLogo from '../../assets/logos/code-gapper-logo.png';

interface HeaderProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSaveSessionRef?: (ref: () => void) => void;
  onCloseModalsRef?: (ref: () => void) => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowToast, onSaveSessionRef, onCloseModalsRef }) => {
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isSessionListOpen, setIsSessionListOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);
  
  const inputCode = useGapStore((state) => state.inputCode);
  const segments = useGapStore((state) => state.segments);
  const answerKey = useGapStore((state) => state.answerKey);
  const userAnswers = useGapStore((state) => state.userAnswers);
  const gapSettings = useGapStore((state) => state.gapSettings);
  const generateGaps = useGapStore((state) => state.generateGaps);
  const setInputCode = useGapStore((state) => state.setInputCode);
  const setGapSettings = useGapStore((state) => state.setGapSettings);
  const reset = useGapStore((state) => state.reset);
  
  const { canInstall, install } = usePWAInstall();
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const sessions = useSessionStore((state) => state.sessions);
  const createSession = useSessionStore((state) => state.createSession);
  const saveCurrentSession = useSessionStore((state) => state.saveCurrentSession);
  const loadSessions = useSessionStore((state) => state.loadSessions);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  
  // Get current session name
  const currentSession = currentSessionId 
    ? sessions.find(s => s.id === currentSessionId)
    : null;
  
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const generateDefaultSessionName = useCallback((): string => {
    const currentSessions = useSessionStore.getState().sessions;
    const sessionCount = currentSessions.length;
    let sessionNumber = sessionCount + 1;
    let name = `Session #${sessionNumber}`;
    
    // Check if name exists and increment until we find an available one
    while (currentSessions.some(s => s.name === name)) {
      sessionNumber++;
      name = `Session #${sessionNumber}`;
    }
    
    return name;
  }, []);

  const handleSaveSession = useCallback(() => {
    let sessionId = currentSessionId;
    let isNewSession = false;
    
    // If no current session, create a new one with default name
    if (!sessionId) {
      const defaultName = generateDefaultSessionName();
      sessionId = createSession(defaultName);
      isNewSession = true;
    }
    
    // Save current state to session
    const savedId = saveCurrentSession({
      inputCode,
      segments,
      answerKey,
      userAnswers,
      gapSettings,
    });
    
    if (savedId) {
      const session = useSessionStore.getState().sessions.find(s => s.id === savedId);
      if (isNewSession) {
        onShowToast?.(`Session "${session?.name || 'Untitled'}" created and saved successfully`, 'success');
      } else {
        onShowToast?.(`Session "${session?.name || 'Untitled'}" saved successfully`, 'success');
      }
    }
  }, [currentSessionId, inputCode, segments, answerKey, userAnswers, gapSettings, createSession, saveCurrentSession, generateDefaultSessionName, onShowToast]);

  // Close all modals function
  const handleCloseModals = useCallback(() => {
    setIsNewSessionModalOpen(false);
    setIsSessionListOpen(false);
  }, []);

  // Expose functions via ref callbacks
  useEffect(() => {
    if (onSaveSessionRef) {
      onSaveSessionRef(handleSaveSession);
    }
  }, [onSaveSessionRef, handleSaveSession]);

  useEffect(() => {
    if (onCloseModalsRef) {
      onCloseModalsRef(handleCloseModals);
    }
  }, [onCloseModalsRef, handleCloseModals]);

  const handleNewSession = () => {
    setIsNewSessionModalOpen(true);
  };

  const handleCreateSession = (sessionId: string, sessionName: string) => {
    // Set the new session as current first
    setCurrentSessionId(sessionId);
    
    // Save current state to new session
    saveCurrentSession({
      inputCode,
      segments,
      answerKey,
      userAnswers,
      gapSettings,
    });
    
    onShowToast?.(`Session "${sessionName}" created successfully`, 'success');
  };

  const handleLoadSession = (session: SessionData) => {
    // Restore all session data
    setInputCode(session.inputCode);
    setGapSettings(session.gapSettings);
    
    // Restore segments and answerKey directly (if they exist)
    if (session.segments && session.segments.length > 0) {
      // Directly update store state
      useGapStore.setState({
        segments: session.segments,
        answerKey: session.answerKey,
        userAnswers: session.userAnswers || {},
        hasChecked: false,
      });
    } else {
      // If no segments, regenerate gaps after a short delay
      setTimeout(() => {
        generateGaps();
      }, 100);
    }
    
    setCurrentSessionId(session.id);
    onShowToast?.(`Session "${session.name}" loaded`, 'success');
  };

  return (
    <>
      <header className="sticky top-0 z-20 h-16 md:h-18 border-b border-slate-700 flex items-center justify-between px-3 md:px-6 bg-slate-900">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <a 
            href="/" 
            className="flex items-center min-h-[44px] min-w-[44px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              reset();
              onShowToast?.('Reset to initial state', 'info');
            }}
          >
            <img 
              src={codeGapperLogo} 
              alt="CodeGapper Logo" 
              className="h-8 md:h-10 w-auto object-contain"
            />
          </a>
          <div className="hidden md:block text-xs text-slate-400">
            Learn programming by filling the gaps
          </div>
          {currentSession && (
            <div className="hidden sm:flex items-center gap-2 px-2 md:px-3 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300">
              <span className="text-slate-500">Active:</span>
              <span className="font-medium truncate max-w-[200px]" title={currentSession.name}>
                {currentSession.name}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          <button
            onClick={handleNewSession}
            className="min-h-[44px] min-w-[44px] px-2 md:px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-slate-200 rounded border border-blue-700 transition-colors flex items-center justify-center gap-1 md:gap-1.5 touch-manipulation"
            title="Create new session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>
          <button
            onClick={handleSaveSession}
            className="hidden sm:flex min-h-[44px] min-w-[44px] px-2 md:px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 active:bg-green-800 text-slate-200 rounded border border-green-700 transition-colors items-center justify-center gap-1 md:gap-1.5 touch-manipulation"
            title="Save current session"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={() => setIsSessionListOpen(true)}
            className="hidden sm:flex min-h-[44px] min-w-[44px] px-2 md:px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 border border-slate-600 rounded transition-colors items-center justify-center gap-1 md:gap-1.5 touch-manipulation"
            title="View all sessions"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sessions</span>
          </button>
          {canInstall && (
            <button
              type="button"
              onClick={install}
              className="hidden sm:flex min-h-[44px] min-w-[44px] px-2 md:px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200 border border-slate-600 rounded transition-colors items-center justify-center gap-1 md:gap-1.5 touch-manipulation"
              title="Install app"
              aria-label="Install app"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}
          <div className="hidden sm:block relative group">
            <button
              onClick={() => window.open('https://buymeacoffee.com/albertahkhyan', '_blank', 'noopener,noreferrer')}
              className="min-h-[44px] min-w-[44px] px-2 md:px-3 py-1.5 text-xs bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-slate-200 rounded border border-pink-700 transition-colors flex items-center justify-center gap-1 md:gap-1.5 touch-manipulation"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Donate</span>
            </button>
            <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-lg border border-slate-700 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
              ☕ Support this project and help it grow
              <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 transform rotate-45"></div>
            </div>
          </div>
          {/* More menu (mobile) */}
          <div className="relative sm:hidden" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((v) => !v)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-300 hover:text-slate-100 hover:bg-slate-700 rounded border border-slate-600 touch-manipulation"
              title="More actions"
              aria-label="More actions"
              aria-expanded={isMoreMenuOpen}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[160px]">
                <button
                  type="button"
                  onClick={() => { handleSaveSession(); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 min-h-[44px]"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSessionListOpen(true); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 min-h-[44px]"
                >
                  <FolderOpen className="w-4 h-4" /> Sessions
                </button>
                {canInstall && (
                  <button
                    type="button"
                    onClick={() => { install(); setIsMoreMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 min-h-[44px]"
                  >
                    <Download className="w-4 h-4" /> Install
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { window.open('https://buymeacoffee.com/albertahkhyan', '_blank', 'noopener,noreferrer'); setIsMoreMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700 min-h-[44px]"
                >
                  <Heart className="w-4 h-4 fill-current" /> Donate
                </button>
              </div>
            )}
          </div>
          <div className="relative group">
      <button
              onClick={() => window.open('https://github.com/albertshkhyan/codegapper-playground', '_blank', 'noopener,noreferrer')}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-slate-100 transition-colors"
              aria-label="GitHub Repository"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      </button>
            {/* Tooltip */}
            <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-lg border border-slate-700 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
              ⭐ Star this project, leave feedback, or report issues on GitHub
              <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 transform rotate-45"></div>
            </div>
          </div>
        </div>
    </header>
      
      <SessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        mode="create"
        onSuccess={handleCreateSession}
      />
      {isSessionListOpen && (
        <Suspense fallback={null}>
          <SessionList
            isOpen={isSessionListOpen}
            onClose={() => setIsSessionListOpen(false)}
            onLoadSession={handleLoadSession}
            onShowToast={onShowToast}
          />
        </Suspense>
      )}
    </>
  );
};
