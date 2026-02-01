import {Alert, AlertTitle, Grid} from '@mui/material';
import React from 'react';
import {HistoricalBalanceTable} from '@/components/Insights';
import {HistoricalBalanceLineChart} from '@/components/Insights/HistoricalBalanceLineChart';

export default function InsightsView() {
  return (
    <React.Fragment>
      <Grid size={{xs: 12, md: 12}}>
        <Alert severity={'warning'}>
          <AlertTitle>Attention</AlertTitle>
          The insights are still in an early development stage. Data accuracy and completeness are not guaranteed.
          Please use with caution and report any issues you encounter.
        </Alert>
      </Grid>

      <Grid size={{xs: 12, md: 6}}>
        <HistoricalBalanceLineChart type={'BASIC'} />
      </Grid>

      {/*<Grid size={{xs: 12, md: 6}}>*/}
      {/*  <HistoricalBalanceLineChart type={'GROUPED_BY_CATEGORY'} startDate={START_DATE} endDate={END_DATE} />*/}
      {/*</Grid>*/}

      <Grid size={{xs: 12, md: 7}}>
        <HistoricalBalanceTable type={'GROUPED_BY_CATEGORY'} dense={false} />
      </Grid>

      <Grid size={{xs: 12, md: 5}}>
        <HistoricalBalanceTable type={'BASIC'} dense={false} />
      </Grid>
    </React.Fragment>
  );
}
