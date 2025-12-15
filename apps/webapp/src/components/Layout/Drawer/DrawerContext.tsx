'use client';

import React from 'react';
import type {ScreenSize} from '@/hooks/useScreenSize';

export type DrawerVisibility = 'shown' | 'hidden';

type DrawerContext = {
  state: DrawerVisibility;
  isOpen: (screenSize: ScreenSize) => boolean;
  toggleVisibility: () => void;
};

const DrawerContext = React.createContext<DrawerContext | undefined>(undefined);

export function useDrawerContext() {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) {
    throw new Error('useDrawerContext must be used inside DrawerProvider');
  }
  return ctx;
}

export const DrawerProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  // const LS_KEY = 'budgetbuddy-drawer-state';
  const [state, setState] = React.useState<DrawerVisibility>('shown');

  const toggleVisibility = () => {
    setState(prevState => {
      const newState = prevState === 'shown' ? 'hidden' : 'shown';
      // persistState(LS_KEY, newState);
      return newState;
    });
  };

  const isOpen = (screenSize: ScreenSize) => {
    if (screenSize === 'small') {
      return state === 'hidden';
    }
    return state === 'shown';
  };

  // React.useEffect(() => {
  //   const persistedState = getPersistedState(LS_KEY);
  //   if (persistedState) {
  //     setState(persistedState);
  //   }
  // }, []);

  return <DrawerContext.Provider value={{state, isOpen, toggleVisibility}}>{children}</DrawerContext.Provider>;
};

// function getPersistedState(key: string): DrawerVisibility | null {
//   if (typeof window !== 'undefined') {
//     const savedState = localStorage.getItem(key);
//     if (savedState === 'shown' || savedState === 'hidden') {
//       return savedState;
//     }
//   }
//   return null;
// }

// function persistState(key: string, state: DrawerVisibility) {
//   if (typeof window !== 'undefined') {
//     localStorage.setItem(key, state);
//   }
// }
