'use client';

import {Moon, Sun} from 'lucide-react';
import {useEffect, useState} from 'react';
import {IconButton} from '@/components/ui/primitives';

const THEME_STORAGE_KEY = 'budgetbuddy-theme';

type Theme = 'light' | 'dark';

function getPreferredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle({className}: {className?: string}) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    document.documentElement.dataset.theme = preferred;
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_STORAGE_KEY, next);
  };

  const dark = theme === 'dark';
  return (
    <IconButton className={className} aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={toggleTheme}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  );
}
