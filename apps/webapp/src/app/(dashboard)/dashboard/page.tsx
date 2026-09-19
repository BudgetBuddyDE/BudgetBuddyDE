import {Grid, Stack} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {BudgetOverviewCard} from '@/components/Budget/BudgetOverviewCard';
import {CategoryExpenseChart} from '@/components/Category/CategoryPieChart';
import {PathnameErrorBoundary, RouteErrorFallback} from '@/components/ErrorBoundary';
import {CircularProgress} from '@/components/Loading';
import {UpcomingRecurringPaymentList} from '@/components/RecurringPayment/RecurringPaymentList';
import {LatestTransactionsList, UpcomingTransactionsList} from '@/components/Transaction/TransactionList';
import {headers} from '@/lib/headers';
import {DashboardStatsWrapper} from './DashboardStatsWrapper';

export default async function DashboardPage() {
  const [estimatedBudget, error] = await apiClient.backend.budget.getEstimatedBudget({headers: await headers()});
  return (
    <React.Fragment>
      <PathnameErrorBoundary>
        <React.Suspense fallback={<CircularProgress />}>
          {error || !estimatedBudget ? (
            <RouteErrorFallback
              error={error ?? new Error('Budget statistics are unavailable')}
              title="Dashboard statistics are temporarily unavailable"
            />
          ) : (
            <DashboardStatsWrapper estimated={estimatedBudget} />
          )}
        </React.Suspense>
      </PathnameErrorBoundary>

      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 3, md: 1},
        }}
      >
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <UpcomingRecurringPaymentList />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>

      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 1, md: 2},
        }}
      >
        <Stack spacing={2}>
          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              {error || !estimatedBudget ? (
                <RouteErrorFallback
                  error={error ?? new Error('Budget data is unavailable')}
                  title="Budget chart is temporarily unavailable"
                />
              ) : (
                <BudgetOverviewCard
                  totalBudget={estimatedBudget.income.received + estimatedBudget.income.upcoming}
                  spent={estimatedBudget.expenses.paid}
                  futureExpenses={estimatedBudget.expenses.upcoming}
                />
              )}
            </React.Suspense>
          </PathnameErrorBoundary>

          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              <CategoryExpenseChart />
            </React.Suspense>
          </PathnameErrorBoundary>
        </Stack>
      </Grid>

      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 2, md: 3},
        }}
      >
        <Stack spacing={2}>
          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              <LatestTransactionsList />
            </React.Suspense>
          </PathnameErrorBoundary>

          <PathnameErrorBoundary>
            <React.Suspense fallback={<CircularProgress />}>
              <UpcomingTransactionsList />
            </React.Suspense>
          </PathnameErrorBoundary>
        </Stack>
      </Grid>
    </React.Fragment>
  );
}
