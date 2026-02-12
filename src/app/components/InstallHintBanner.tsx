import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'codegapper_install_hint_seen';

export interface InstallHintBannerProps {
  canInstall: boolean;
  onDismiss?: () => void;
}

export const InstallHintBanner: React.FC<InstallHintBannerProps> = ({ canInstall, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!canInstall || !isMobile) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, [canInstall, isMobile]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 py-2 px-3 bg-slate-700/90 text-slate-200 text-sm border-b border-slate-600"
    >
      <span>Add to Home Screen for a full-screen experience.</span>
      <button
        type="button"
        onClick={handleDismiss}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-200 p-2 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
