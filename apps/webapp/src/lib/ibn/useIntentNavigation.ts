'use client';

import {useRouter} from 'next/navigation';
import React from 'react';
import type {Intent} from './types';
import {buildIntentHref} from './url';

/**
 * Provides declarative URL generation and imperative navigation for intents.
 *
 * Must be used in a client component because imperative navigation delegates to
 * Next.js' router.
 */
export function useIntentNavigation(): {
  navigateIntent: (intent: Intent) => void;
  hrefForIntent: (intent: Intent) => string;
} {
  const router = useRouter();

  const hrefForIntent = React.useCallback((intent: Intent) => buildIntentHref(intent), []);
  const navigateIntent = React.useCallback((intent: Intent) => router.push(buildIntentHref(intent)), [router]);

  return {navigateIntent, hrefForIntent};
}
