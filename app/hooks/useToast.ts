/**
 * Enhanced Toast Hook
 * Manages multiple toast notifications with different severity levels
 */
import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info',
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    
    // Default durations based on type
    const defaultDuration = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
    const duration = options?.duration !== undefined ? options.duration : defaultDuration;
    
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action: options?.action
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss if duration is set and > 0
    if (duration && duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
