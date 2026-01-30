import {Grid} from '@mui/material';
import React from 'react';
import {Formatter} from '@/utils/Formatter';
import {HistoricalBalanceTable} from '@/components/Insights';

export default async function InsightsView() {
  return (
    <React.Fragment>
      <Grid size={{xs: 12, md: 7}}>
        <HistoricalBalanceTable type={'GROUPED_BY_CATEGORY'} dense={false} />
      </Grid>

      <Grid size={{xs: 12, md: 5}}>
        <HistoricalBalanceTable type={'BASIC'} dense={false} />
      </Grid>

      <Grid size={{xs: 12, md: 6}}>
        <strong>Historical chart of income and or exenpses grouped by month</strong>
        <strong>Bars will show incom and expenses per month</strong>
        <strong>Line series will show the balance for the according month</strong>
      </Grid>

      <Grid size={{xs: 12, md: 6}}>
        <strong>Historical chart of income and or exenpses grouped by month and category</strong>
        <strong>Bars will show incom and expenses per month and category</strong>
        <strong>Line series will show the balance for the according month</strong>
      </Grid>

      <Grid size={{xs: 12, md: 12}} container>
        <Grid size={{xs: 12, md: 4}}>
          <strong>
            Overview of expenses/income by (category and receiver receiver will not be case sensitive) (chart view)
          </strong>
        </Grid>

        <Grid size={{xs: 12, md: 4}} container>
          <Grid size={{xs: 6, md: 6}}>Stats card 1</Grid>
          <Grid size={{xs: 6, md: 6}}>Stats card 2</Grid>
          <Grid size={{xs: 6, md: 6}}>Stats card 3</Grid>
          <Grid size={{xs: 6, md: 6}}>Stats card 4</Grid>
        </Grid>

        <Grid size={{xs: 12, md: 4}}>
          <strong>Overview of expenses/income by payment method (chart view)</strong>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
