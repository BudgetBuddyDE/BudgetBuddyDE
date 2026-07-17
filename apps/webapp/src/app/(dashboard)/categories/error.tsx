'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function CategoriesError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <RouteErrorFallback error={error} reset={reset} title="Categories are temporarily unavailable" />;
}
