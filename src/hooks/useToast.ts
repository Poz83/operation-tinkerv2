/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';

export interface ToastType {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  emoji?: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, emoji?: string) => {
    const id = Date.now() + Math.random(); // Ensure uniqueness
    const newToast: ToastType = { id, type, message, emoji };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    success: (msg: string, emoji?: string) => showToast('success', msg, emoji),
    error: (msg: string, emoji?: string) => showToast('error', msg, emoji),
    warning: (msg: string, emoji?: string) => showToast('warning', msg, emoji),
    info: (msg: string, emoji?: string) => showToast('info', msg, emoji),
    remove: removeToast,
  };
};
