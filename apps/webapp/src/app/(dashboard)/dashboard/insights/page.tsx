import {Grid} from '@mui/material';
import React from 'react';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {HistoricalBalanceTable} from '@/components/Insights';
import {HistoricalBalanceLineChart} from '@/components/Insights/HistoricalBalanceLineChart';
import {CircularProgress} from '@/components/Loading';

export default function InsightsView() {
  return (
    <React.Fragment>
      <Grid size={{xs: 12, md: 6}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <HistoricalBalanceLineChart type={'BASIC'} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>

      {/*<Grid size={{xs: 12, md: 6}}>*/}
      {/*  <HistoricalBalanceLineChart type={'GROUPED_BY_CATEGORY'} startDate={START_DATE} endDate={END_DATE} />*/}
      {/*</Grid>*/}

      <Grid size={{xs: 12, md: 7}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <HistoricalBalanceTable type={'GROUPED_BY_CATEGORY'} dense={false} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>

      <Grid size={{xs: 12, md: 5}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <HistoricalBalanceTable type={'BASIC'} dense={false} />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>
    </React.Fragment>
  );
}
