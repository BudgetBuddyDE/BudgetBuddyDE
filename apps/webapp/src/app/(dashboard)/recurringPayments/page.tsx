import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {parseRecurringPaymentFiltersFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {CircularProgress} from '@/components/Loading';
import {RecurringPaymentTable} from '@/components/RecurringPayment/RecurringPaymentTable';

export default async function RecurringPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialFilters = parseRecurringPaymentFiltersFromParams(params);

  return (
    <ContentGrid title="Recurring Payments">
      <Grid size="grow">
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <RecurringPaymentTable initialFilters={initialFilters} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </ContentGrid>
  );
}
