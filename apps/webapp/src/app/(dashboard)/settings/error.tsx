'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export default function SettingsError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const t = useAppTranslations();
  return <RouteErrorFallback error={error} reset={reset} title={t('Settings are temporarily unavailable')} />;
}
