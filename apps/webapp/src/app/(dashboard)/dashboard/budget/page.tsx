import {Grid} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {BudgetList} from '@/components/Budget/BudgetList';
import {SpendingGoalsRadarChart} from '@/components/Budget/SpendingGoals';
import {CategoryExpenseChart, CategoryIncomeChart} from '@/components/Category/CategoryPieChart';
import {PathnameErrorBoundary, RouteErrorFallback} from '@/components/ErrorBoundary';
import {CircularProgress} from '@/components/Loading';
import {RecurringPaymentPieChart} from '@/components/RecurringPayment/RecurringPaymentPieChart';
import {headers} from '@/lib/headers';
import {DashboardStatsWrapper} from '../DashboardStatsWrapper';

export default async function BudgetView() {
  const requestHeaders = await headers();
  const [[budgets, error], [estimated, estimatedError]] = await Promise.all([
    apiClient.backend.budget.getAll(
      {
        from: 0,
        to: 10,
      },
      {headers: requestHeaders},
    ),
    apiClient.backend.budget.getEstimatedBudget({headers: requestHeaders}),
  ]);
  return (
    <React.Fragment>
      <PathnameErrorBoundary>
        <React.Suspense fallback={<CircularProgress />}>
          {estimatedError || !estimated ? (
            <RouteErrorFallback
              error={estimatedError ?? new Error('Budget statistics are unavailable')}
              title="Budget statistics are temporarily unavailable"
            />
          ) : (
            <DashboardStatsWrapper estimated={estimated} />
          )}
        </React.Suspense>
      </PathnameErrorBoundary>

      <Grid size={{xs: 12, md: 8}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <BudgetList />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>

      <Grid size={{xs: 12, md: 4}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <SpendingGoalsRadarChart budgets={budgets?.data ?? []} error={error} />
          </React.Suspense>
        </PathnameErrorBoundary>
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
          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>{children}</React.Suspense>
          </PathnameErrorBoundary>
        </Grid>
      ))}
    </React.Fragment>
  );
}
