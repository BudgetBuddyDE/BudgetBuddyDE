import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {CircularProgress} from '@/components/Loading';
import {AppInformation} from '@/components/Settings/AppInformation';
import {EditUser} from '@/components/User/EditUser';
import {UserAccounts} from '@/components/User/UserAccounts';
import {UserSessions} from '@/components/User/UserSessions';

export default function SettingsProfilePage() {
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

      <Grid container size={{xs: 12, md: 5}}>
        <Grid size={{xs: 12}}>
          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              <EditUser />
            </React.Suspense>
          </PathnameErrorBoundary>
        </Grid>
      </Grid>

      <Grid container size={{xs: 12, md: 3.5}} spacing={2}>
        <Grid size={{xs: 12}}>
          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              <UserAccounts />
            </React.Suspense>
          </PathnameErrorBoundary>
        </Grid>

        <Grid size={{xs: 12}}>
          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              <UserSessions />
            </React.Suspense>
          </PathnameErrorBoundary>
        </Grid>
      </Grid>
    </Grid>
  );
}
