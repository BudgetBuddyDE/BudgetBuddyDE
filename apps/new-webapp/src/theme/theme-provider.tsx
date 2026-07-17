'use client';

import {Moon, Sun} from 'lucide-react';
import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {IconButton} from '@/components/ui/primitives';
import {useI18n} from '@/lib/i18n';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'budgetbuddy-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function preferredTheme(): ThemeMode {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    setMode(preferredTheme());
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggle: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}

export function ThemeToggle({className}: {className?: string}) {
  const {mode, toggle} = useTheme();
  const {t} = useI18n();
  const label = mode === 'dark' ? t('theme.useLight') : t('theme.useDark');
  return (
    <IconButton className={className} aria-label={label} aria-pressed={mode === 'dark'} onClick={toggle}>
      {mode === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </IconButton>
  );
}
