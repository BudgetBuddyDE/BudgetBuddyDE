'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';

export default function DashboardError({
  error,
  reset,
}: Readonly<{
  error: Error & {digest?: string};
  reset: () => void;
}>) {
  return <RouteErrorFallback error={error} reset={reset} title="Dashboard is temporarily unavailable" />;
}
