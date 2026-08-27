import {Grid, Stack} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {CircularProgress} from '@/components/Loading';
import {
  parseOccurrenceRangeParams,
  RecurringPaymentOccurrenceTable,
  RecurringPaymentsNav,
} from '@/components/RecurringPayment/OccurrenceTable';

export default async function RecurringPaymentOccurrencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialRange = parseOccurrenceRangeParams(params);

  return (
    <ContentGrid title="Recurring Payments">
      <Grid size="grow">
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <Stack gap={2} sx={{minWidth: 0}}>
              <RecurringPaymentsNav view="occurrences" />
              <RecurringPaymentOccurrenceTable initialRange={initialRange} />
            </Stack>
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </ContentGrid>
  );
}
