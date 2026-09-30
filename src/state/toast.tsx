/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

interface ToastState {
  id: number;
  message: string;
  tone: 'neutral' | 'error';
}

interface ToastApi {
  message: string | null;
  tone: ToastState['tone'];
  notify: (message: string, tone?: ToastState['tone']) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | null>(null);

  const notify = useCallback((message: string, tone: ToastState['tone'] = 'neutral') => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo<ToastApi>(
    () => ({ message: toast?.message ?? null, tone: toast?.tone ?? 'neutral', notify }),
    [toast, notify],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
