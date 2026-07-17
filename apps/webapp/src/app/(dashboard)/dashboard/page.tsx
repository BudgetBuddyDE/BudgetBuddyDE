import {Grid, Stack} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {BudgetPieChart} from '@/components/Budget/BudgetPieChart';
import {CategoryExpenseChart} from '@/components/Category/CategoryPieChart';
import {PathnameErrorBoundary} from '@/components/ErrorBoundary';
import {CircularProgress} from '@/components/Loading';
import {UpcomingRecurringPaymentList} from '@/components/RecurringPayment/RecurringPaymentList';
import {LatestTransactionsList, UpcomingTransactionsList} from '@/components/Transaction/TransactionList';
import {headers} from '@/lib/headers';
import {logger} from '@/logger';
import {DashboardStatsWrapper} from './DashboardStatsWrapper';

export default async function DashboardPage() {
  const [estimatedBudget, error] = await apiClient.backend.budget.getEstimatedBudget({headers: await headers()});
  if (error) {
    logger.error(error.message);
    throw error;
  }

  return (
    <React.Fragment>
      <PathnameErrorBoundary>
        <React.Suspense fallback={<CircularProgress />}>
          <DashboardStatsWrapper estimated={estimatedBudget} />
        </React.Suspense>
      </PathnameErrorBoundary>

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 3, md: 1}}>
        <PathnameErrorBoundary>
          <React.Suspense fallback={<CircularProgress />}>
            <UpcomingRecurringPaymentList />
          </React.Suspense>
        </PathnameErrorBoundary>
      </Grid>

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 1, md: 2}}>
        <Stack spacing={2}>
          <CategoryExpenseChart />

          <BudgetPieChart
            initialData={{
              expenses: estimatedBudget.expenses.paid,
              upcomingExpenses: estimatedBudget.expenses.upcoming,
              freeAmount: estimatedBudget.freeAmount,
            }}
          />
        </Stack>
      </Grid>

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 2, md: 3}}>
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
