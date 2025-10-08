import React from 'react';
import { DashboardStatsWrapper } from '../DashboardStatsWrapper';
import { Grid } from '@mui/material';
import { CategoryExpenseChart, CategoryIncomeChart } from '@/components/Category/CategoryPieChart';
import { SubscriptionPieChart } from '@/components/Subscription/SubscriptionPieChart';
import { BudgetList } from '@/components/Budget/BudgetList';

export default function AnalyticsDashboard() {
  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      <Grid size={{ xs: 12, md: 6 }}>
        <BudgetList />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }} display={{ xs: 'none', md: 'block' }} />

      {[
        { key: 'monthly-balance-pie-chart', children: <SubscriptionPieChart withViewMore /> },
        { key: 'category-income-pie-chart', children: <CategoryIncomeChart withViewMore /> },
        { key: 'category-expense-pie-chart', children: <CategoryExpenseChart withViewMore /> },
      ].map(({ key, children }) => (
        <Grid key={key} size={{ xs: 12, md: 4 }}>
          {children}
        </Grid>
      ))}
    </React.Fragment>
  );
}
