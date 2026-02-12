import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Header } from './Header';
import { GappedCodePanel } from './GappedCodePanel';

const CodeEditorPanel = lazy(() => import('./CodeEditorPanel').then((m) => ({ default: m.CodeEditorPanel })));
import { ResultsPanel } from './ResultsPanel';
import { ToastContainer } from './ToastContainer';
import { KeyboardShortcutsFooter } from './KeyboardShortcutsFooter';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { OfflineBanner } from './OfflineBanner';
import { InstallHintBanner } from './InstallHintBanner';
interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const AppLayout: React.FC = () => {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const { canInstall } = usePWAInstall();
  
  // Touch/swipe handling for mobile
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Store refs for actions
  const checkAnswersRef = useRef<(() => void) | undefined>(undefined);
  const generateGapsRef = useRef<(() => void) | undefined>(undefined);
  const saveSessionRef = useRef<(() => void) | undefined>(undefined);
  const closeModalsRef = useRef<(() => void) | undefined>(undefined);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' && target.getAttribute('type') === 'text' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Tab navigation between gaps
        if (e.key === 'Tab' && target.tagName === 'INPUT') {
          // Let default Tab behavior work for gap navigation
          return;
        }
        // Allow Esc to close modals even when typing
        if (e.key === 'Escape') {
          closeModalsRef.current?.();
          return;
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Enter: Check answers
      if (modKey && e.key === 'Enter') {
        e.preventDefault();
        if (checkAnswersRef.current) {
          checkAnswersRef.current();
        }
      }

      // Ctrl/Cmd + G: Generate gaps
      if (modKey && e.key === 'g') {
        e.preventDefault();
        if (generateGapsRef.current) {
          generateGapsRef.current();
        }
      }

      // Ctrl/Cmd + S: Save session
      if (modKey && e.key === 's') {
        e.preventDefault();
        if (saveSessionRef.current) {
          saveSessionRef.current();
        }
      }

      // Esc: Close modals
      if (e.key === 'Escape') {
        if (closeModalsRef.current) {
          closeModalsRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Swipe gesture handler for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

    // Swipe detection: horizontal swipe > 50px, vertical < 30px, time < 300ms
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30 && deltaTime < 300) {
      // Swipe right: open panel
      if (deltaX > 0 && !isLeftPanelOpen) {
        setIsLeftPanelOpen(true);
      }
      // Swipe left: close panel
      else if (deltaX < 0 && isLeftPanelOpen) {
        setIsLeftPanelOpen(false);
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-950 relative">
      <Header 
        onShowToast={showToast} 
        onSaveSessionRef={(ref) => { saveSessionRef.current = ref; }}
        onCloseModalsRef={(ref) => { closeModalsRef.current = ref; }}
      />
      <OfflineBanner />
      <InstallHintBanner canInstall={canInstall} />
      <div 
        className="flex-1 overflow-y-auto p-2 md:p-4 min-h-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col relative">
          <div 
            className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4" 
            style={{ 
              height: 'calc(100dvh - 180px)',
              minHeight: 'calc(100dvh - 180px)',
            }}
          >
            <div 
              className="transition-all duration-300 ease-in-out motion-reduce:duration-0 md:h-full"
              style={{
                width: isMobile 
                  ? (isLeftPanelOpen ? '100%' : '48px')
                  : (isLeftPanelOpen ? 'calc(50% - 8px)' : '48px'),
                minWidth: isMobile 
                  ? (isLeftPanelOpen ? '100%' : '48px')
                  : (isLeftPanelOpen ? 'calc(50% - 8px)' : '48px'),
                height: isMobile 
                  ? (isLeftPanelOpen ? '50%' : '48px')
                  : '100%',
                minHeight: isMobile && isLeftPanelOpen ? '300px' : undefined,
                flexShrink: 0,
              }}
            >
              <Suspense fallback={<div className="h-full min-h-[300px] bg-slate-900/50 rounded border border-slate-700 animate-pulse" />}>
                <CodeEditorPanel 
                  isOpen={isLeftPanelOpen}
                  onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                />
              </Suspense>
            </div>
            <div className="flex-1 transition-all duration-300 ease-in-out motion-reduce:duration-0 md:h-full" style={{ minHeight: '300px' }}>
              <GappedCodePanel 
                ref={(instance) => {
                  if (instance) {
                    generateGapsRef.current = instance.generateGaps;
                  }
                }}
              />
            </div>
          </div>
          <div className="relative pb-4">
            <ResultsPanel ref={(instance) => {
              if (instance) {
                checkAnswersRef.current = instance.checkAnswers;
              }
            }} />
            <div className="mt-4">
              <KeyboardShortcutsFooter />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button
        type="button"
        onClick={() => setIsShortcutsModalOpen(true)}
        className="fixed bottom-4 right-4 z-30 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 shadow-lg touch-manipulation"
        title="Shortcuts &amp; About"
        aria-label="Shortcuts and about"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
      <KeyboardShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
    </div>
  );
};
