'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export default function DashboardError({
  error,
  reset,
}: Readonly<{
  error: Error & {digest?: string};
  reset: () => void;
}>) {
  const t = useAppTranslations();
  return <RouteErrorFallback error={error} reset={reset} title={t('Dashboard is temporarily unavailable')} />;
}
