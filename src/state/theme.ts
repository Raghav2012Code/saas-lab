import { useCallback, useEffect, useState } from 'react';

import { THEME_KEY } from '../engine/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage unavailable — fall through */
  }
  return 'system';
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && systemPrefersDark());
}

function apply(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', resolveDark(mode));
}

const order: ThemeMode[] = ['system', 'light', 'dark'];

export function useTheme(): {
  mode: ThemeMode;
  cycle: () => void;
  set: (mode: ThemeMode) => void;
} {
  const [mode, setMode] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    apply(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => apply('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((current) => {
      const index = order.indexOf(current);
      const next = order[(index + 1) % order.length];
      return next ?? 'system';
    });
  }, []);

  return { mode, cycle, set: setMode };
}

export function themeLabel(mode: ThemeMode): string {
  if (mode === 'light') return 'Light';
  if (mode === 'dark') return 'Dark';
  return 'System';
}
