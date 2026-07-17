import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {parseKeywordFilterFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {CircularProgress} from '@/components/Loading';
import {PaymentMethodTable} from '@/components/PaymentMethod/PaymentMethodTable';

export default async function PaymentMethodsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const {keyword} = parseKeywordFilterFromParams(params);

  return (
    <ContentGrid title="Payment Methods">
      <Grid size={{xs: 12, md: 12}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <PaymentMethodTable initialKeyword={keyword ?? undefined} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </ContentGrid>
  );
}
