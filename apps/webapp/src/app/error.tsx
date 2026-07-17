'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function AppError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="This page is temporarily unavailable" />;
}
