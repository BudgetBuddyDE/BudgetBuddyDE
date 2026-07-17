import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {CircularProgress} from '@/components/Loading';
import {ApiKeyTable} from '@/components/User/ApiKey';

export default function ApiKeysPage() {
  return (
    <Grid container spacing={2}>
      <Grid size={{xs: 12, md: 7}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <ApiKeyTable />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </Grid>
  );
}
