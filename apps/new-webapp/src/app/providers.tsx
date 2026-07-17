'use client';

import type {ReactNode} from 'react';
import {PreferencesProvider} from '@/preferences/preferences-provider';
import {ThemeProvider} from '@/theme/theme-provider';

export function AppProviders({children}: {children: ReactNode}) {
  return (
    <PreferencesProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </PreferencesProvider>
  );
}
