import {Grid} from '@mui/material';
import React from 'react';
import {BudgetList} from '@/components/Budget/BudgetList';
import {CategoryExpenseChart, CategoryIncomeChart} from '@/components/Category/CategoryPieChart';
import {RecurringPaymentPieChart} from '@/components/RecurringPayment/RecurringPaymentPieChart';
import {DashboardStatsWrapper} from '../DashboardStatsWrapper';

export default function AnalyticsDashboard() {
  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      <Grid size={{xs: 12, md: 6}}>
        <BudgetList />
      </Grid>

      <Grid size={{xs: 12, md: 6}} display={{xs: 'none', md: 'block'}} />

      {[
        {
          key: 'monthly-balance-pie-chart',
          children: <RecurringPaymentPieChart withViewMore />,
        },
        {
          key: 'category-income-pie-chart',
          children: <CategoryIncomeChart withViewMore />,
        },
        {
          key: 'category-expense-pie-chart',
          children: <CategoryExpenseChart withViewMore />,
        },
      ].map(({key, children}) => (
        <Grid key={key} size={{xs: 12, md: 4}}>
          {children}
        </Grid>
      ))}
    </React.Fragment>
  );
}
