/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface ToastState {
  id: number;
  message: string;
  tone: 'neutral' | 'error';
}

interface ToastApi {
  message: string | null;
  tone: ToastState['tone'];
  /** true while the toast is fading out, so it can animate its exit */
  closing: boolean;
  notify: (message: string, tone?: ToastState['tone']) => void;
}

const VISIBLE_MS = 2400;
const EXIT_MS = 120;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [closing, setClosing] = useState(false);

  const notify = useCallback((message: string, tone: ToastState['tone'] = 'neutral') => {
    setClosing(false);
    setToast({ id: Date.now(), message, tone });
  }, []);

  // Exit animation first, unmount after, so enter and exit are symmetrical.
  useEffect(() => {
    if (!toast) return;
    const closeTimer = window.setTimeout(() => setClosing(true), VISIBLE_MS);
    const doneTimer = window.setTimeout(() => {
      setToast(null);
      setClosing(false);
    }, VISIBLE_MS + EXIT_MS);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [toast]);

  const value = useMemo<ToastApi>(
    () => ({ message: toast?.message ?? null, tone: toast?.tone ?? 'neutral', closing, notify }),
    [toast, closing, notify],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
