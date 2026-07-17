'use client';

import {StatePanel} from '@/components/shared';
export default function DashboardError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <StatePanel state="error" onRetry={reset} />;
}
