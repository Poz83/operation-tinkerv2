/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { ToastType } from './hooks/useToast';

interface ToastProps extends ToastType {
  onClose: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, emoji, onClose }) => {
  const colors = {
    success: 'from-green-500 to-emerald-500',
    error: 'from-red-500 to-pink-500',
    warning: 'from-amber-500 to-orange-500',
    info: 'from-blue-500 to-cyan-500',
  };

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        bg-gradient-to-r ${colors[type]} text-white
        shadow-2xl shadow-black/30 backdrop-blur-xl
        animate-in slide-in-from-right-12 duration-300
        pointer-events-auto
      `}
      role="alert"
    >
      {emoji && <span className="text-xl">{emoji}</span>}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-2 hover:scale-110 transition-transform text-white/80 hover:text-white"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  );
};
