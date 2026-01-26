import {Grid} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {BudgetList} from '@/components/Budget/BudgetList';
import {SpendingGoalsRadarChart} from '@/components/Budget/SpendingGoals';
import {CategoryExpenseChart, CategoryIncomeChart} from '@/components/Category/CategoryPieChart';
import {RecurringPaymentPieChart} from '@/components/RecurringPayment/RecurringPaymentPieChart';
import {headers} from '@/lib/headers';
import {DashboardStatsWrapper} from '../DashboardStatsWrapper';

export default async function BudgetView() {
  const [budgets, error] = await apiClient.backend.budget.getAll(
    {
      from: 0,
      to: 10,
    },
    {
      headers: await headers(),
    },
  );
  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      <Grid size={{xs: 12, md: 8}}>
        <BudgetList />
      </Grid>

      <Grid size={{xs: 12, md: 4}}>
        <SpendingGoalsRadarChart budgets={budgets?.data ?? []} error={error} />
      </Grid>

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
