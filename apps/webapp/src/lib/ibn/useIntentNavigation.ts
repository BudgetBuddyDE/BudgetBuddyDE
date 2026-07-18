'use client';

import {useRouter} from 'next/navigation';
import React from 'react';
import type {Intent} from './types';
import {buildIntentHref} from './url';

export function useIntentNavigation(): {
  navigateIntent: (intent: Intent) => void;
  hrefForIntent: (intent: Intent) => string;
} {
  const router = useRouter();

  const hrefForIntent = React.useCallback((intent: Intent) => buildIntentHref(intent), []);
  const navigateIntent = React.useCallback((intent: Intent) => router.push(buildIntentHref(intent)), [router]);

  return {navigateIntent, hrefForIntent};
}
