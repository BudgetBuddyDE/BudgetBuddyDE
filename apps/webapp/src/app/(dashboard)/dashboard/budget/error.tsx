'use client';

import {RouteErrorFallback} from '@/components/ErrorBoundary';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export default function BudgetError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const t = useAppTranslations();
  return (
    <RouteErrorFallback error={error} reset={reset} title={t('budgets.dashboardBudgetViewIsTemporarilyUnavailable')} />
  );
}
