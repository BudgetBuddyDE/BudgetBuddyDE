'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function AuthError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="Authentication is temporarily unavailable" />;
}
