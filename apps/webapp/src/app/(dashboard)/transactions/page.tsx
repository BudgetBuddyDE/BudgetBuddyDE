import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {parseTransactionFiltersFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {CircularProgress} from '@/components/Loading';
import {TransactionTable} from '@/components/Transaction/TransactionTable';
import {getAppTranslations} from '@/i18n/server';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getAppTranslations();
  const params = await searchParams;
  const initialFilters = parseTransactionFiltersFromParams(params);

  return (
    <ContentGrid title={t('transactions.transactions')}>
      <Grid size="grow">
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <TransactionTable initialFilters={initialFilters} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </ContentGrid>
  );
}
