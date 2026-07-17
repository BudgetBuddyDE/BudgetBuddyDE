'use client';

import {createContext, type ReactNode, useContext, useEffect, useMemo, useState} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function ThemeProvider({children}: {children: ReactNode}) {
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const saved = window.localStorage.getItem('budgetbuddy-theme');
    const initial: ThemeMode = saved === 'light' || saved === 'dark' ? saved : 'system';
    setModeState(initial);
    applyTheme(initial);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode(nextMode) {
        setModeState(nextMode);
        window.localStorage.setItem('budgetbuddy-theme', nextMode);
        applyTheme(nextMode);
      },
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
