'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function PaymentMethodsError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="Payment methods are temporarily unavailable" />;
}
