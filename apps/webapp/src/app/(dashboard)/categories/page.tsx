import {Grid} from '@mui/material';
import React from 'react';
import {CategoryTable} from '@/components/Category/CategoryTable';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {parseKeywordFilterFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {CircularProgress} from '@/components/Loading';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const {keyword} = parseKeywordFilterFromParams(params);

  return (
    <ContentGrid title="Categories">
      <Grid size={{xs: 12, md: 12}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <CategoryTable initialKeyword={keyword ?? undefined} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </ContentGrid>
  );
}
