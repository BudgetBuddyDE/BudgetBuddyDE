'use client';

import {createContext, type ReactNode, useContext, useEffect, useMemo, useState} from 'react';

import {defaultPreferences, type Preferences, setActivePreferences} from './preferences';

const PreferencesContext = createContext<{
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
} | null>(null);

export function PreferencesProvider({children}: {children: ReactNode}) {
  const [preferences, setState] = useState(defaultPreferences);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('budgetbuddy.preferences');
      if (stored) setState({...defaultPreferences, ...(JSON.parse(stored) as Partial<Preferences>)});
    } catch {
      window.localStorage.removeItem('budgetbuddy.preferences');
    }
  }, []);
  setActivePreferences(preferences);
  useEffect(() => {
    document.documentElement.lang = preferences.locale;
  }, [preferences.locale]);
  const value = useMemo(
    () => ({
      preferences,
      setPreferences(next: Preferences) {
        setActivePreferences(next);
        setState(next);
        window.localStorage.setItem('budgetbuddy.preferences', JSON.stringify(next));
        document.cookie = `budgetbuddy-preferences=${encodeURIComponent(JSON.stringify(next))}; Path=/; Max-Age=31536000; SameSite=Lax`;
      },
    }),
    [preferences],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used within PreferencesProvider');
  return value;
}
