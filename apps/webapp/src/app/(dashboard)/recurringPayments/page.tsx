import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {parseRecurringPaymentFiltersFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {CircularProgress} from '@/components/Loading';
import {parseOccurrenceRangeParams, RecurringPaymentsView} from '@/components/RecurringPayment/OccurrenceTable';

export default async function RecurringPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialFilters = parseRecurringPaymentFiltersFromParams(params);
  const initialRange = parseOccurrenceRangeParams(params);

  return (
    <ContentGrid title="Recurring Payments">
      <Grid size="grow">
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <RecurringPaymentsView initialFilters={initialFilters} initialRange={initialRange} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </ContentGrid>
  );
}
