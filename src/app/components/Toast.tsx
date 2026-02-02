import React, { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' 
    ? 'bg-green-600' 
    : type === 'error' 
    ? 'bg-red-600' 
    : 'bg-blue-600';

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
        {type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-slate-200 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
