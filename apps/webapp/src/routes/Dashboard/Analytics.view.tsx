import {Grid2 as Grid} from '@mui/material';
import React from 'react';

import {DashboardStatsWrapper} from '@/components/DashboardStatsWrapper';
import {CategoryExpenseChart, CategoryIncomeChart} from '@/features/Category';
import {SubscriptionPieChart} from '@/features/Subscription';

const AnalyticsView = () => {
  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      {[
        {key: 'monthly-balance-pie-chart', children: <SubscriptionPieChart />},
        {key: 'category-income-pie-chart', children: <CategoryIncomeChart withViewMore />},
        {key: 'category-expense-pie-chart', children: <CategoryExpenseChart withViewMore />},
      ].map(({key, children}) => (
        <Grid key={key} size={{xs: 12, md: 4}}>
          {children}
        </Grid>
      ))}
    </React.Fragment>
  );
};

export default AnalyticsView;
