'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function InsightsError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="Insights are temporarily unavailable" />;
}
