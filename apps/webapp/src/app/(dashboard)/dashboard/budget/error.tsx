'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function BudgetError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="Budget view is temporarily unavailable" />;
}
