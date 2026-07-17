'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function RecurringPaymentsError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="Recurring payments are temporarily unavailable" />;
}
