'use client';

import React from 'react';
import type {ScreenSize} from '@/hooks/useScreenSize';

export type DrawerVisibility = 'shown' | 'hidden';
const DRAWER_STATE_KEY = 'budgetbuddy-drawer-state';

type DrawerContext = {
  state: DrawerVisibility;
  isOpen: (screenSize: ScreenSize) => boolean;
  toggleVisibility: (screenSize: ScreenSize) => void;
};

type DrawerProviderProps = React.PropsWithChildren<{
  initialState?: DrawerVisibility;
  hasPersistedState?: boolean;
}>;

const DrawerContext = React.createContext<DrawerContext | undefined>(undefined);

export function useDrawerContext() {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) {
    throw new Error('useDrawerContext must be used inside DrawerProvider');
  }
  return ctx;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({
  children,
  initialState = 'shown',
  hasPersistedState = false,
}) => {
  const [state, setState] = React.useState<DrawerVisibility>(initialState);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const userChangedState = React.useRef(false);

  React.useEffect(() => {
    if (hasPersistedState) return;

    const persistedState = getPersistedState();
    if (persistedState && !userChangedState.current) {
      setState(persistedState);
      persistState(persistedState);
    }
  }, [hasPersistedState]);

  const toggleVisibility = (screenSize: ScreenSize) => {
    if (screenSize === 'small') {
      setMobileOpen(prevOpen => !prevOpen);
      return;
    }

    userChangedState.current = true;
    const newState = state === 'shown' ? 'hidden' : 'shown';
    setState(newState);
    persistState(newState);
  };

  const isOpen = (screenSize: ScreenSize) => {
    if (screenSize === 'small') {
      return mobileOpen;
    }
    return state === 'shown';
  };

  return <DrawerContext.Provider value={{state, isOpen, toggleVisibility}}>{children}</DrawerContext.Provider>;
};

function getPersistedState(): DrawerVisibility | null {
  if (typeof window === 'undefined') return null;

  try {
    const savedState = window.localStorage.getItem(DRAWER_STATE_KEY);
    return savedState === 'shown' || savedState === 'hidden' ? savedState : null;
  } catch {
    return null;
  }
}

function persistState(state: DrawerVisibility) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(DRAWER_STATE_KEY, state);
  } catch {
    // Keep the drawer usable when browser storage is unavailable.
  }

  document.cookie = `${DRAWER_STATE_KEY}=${state}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
