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
import {getAppTranslations} from '@/i18n/server';

export default async function RecurringPaymentOccurrencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getAppTranslations();
  const params = await searchParams;
  const initialRange = parseOccurrenceRangeParams(params);

  return (
    <ContentGrid title={t('transactions.recurringPayments')}>
      <Grid size="grow">
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <Stack
              spacing={2}
              sx={{
                minWidth: 0,
              }}
            >
              <RecurringPaymentsNav view="occurrences" />
              <RecurringPaymentOccurrenceTable initialRange={initialRange} />
            </Stack>
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </ContentGrid>
  );
}
