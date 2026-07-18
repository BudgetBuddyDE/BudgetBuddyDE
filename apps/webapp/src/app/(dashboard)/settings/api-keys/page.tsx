import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {CircularProgress} from '@/components/Loading';
import {AppInformation} from '@/components/Settings/AppInformation';
import {ApiKeyTable} from '@/components/User/ApiKey';

export default function ApiKeysPage() {
  return (
    <Grid container spacing={2}>
      <Grid container size={{xs: 12, md: 3.5}} spacing={2}>
        <Grid size={{xs: 12}}>
          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              <AppInformation />
            </React.Suspense>
          </PathnameErrorBoundary>
        </Grid>
      </Grid>

      <Grid size={{xs: 12, md: 8.5}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <ApiKeyTable />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </Grid>
  );
}
