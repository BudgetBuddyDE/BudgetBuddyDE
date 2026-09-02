'use client';

import {clearRequestCache} from '@budgetbuddyde/api';
import AddIcon from '@mui/icons-material/AddRounded';
import {Box, Grid, LinearProgress, Stack} from '@mui/material';
import React from 'react';
import {authClient} from '@/authClient';
import {BudgetPieChart} from '@/components/Budget/BudgetPieChart';
import {Card} from '@/components/Card';
import {CategoryExpenseChart} from '@/components/Category/CategoryPieChart';
import {ErrorAlert} from '@/components/ErrorAlert';
import {IntentButton} from '@/components/IBN';
import {parseLocalDateOnly} from '@/components/RecurringPayment/dateOnly';
import {RecurringPaymentList} from '@/components/RecurringPayment/RecurringPaymentList/RecurringPaymentList';
import {TransactionList} from '@/components/Transaction/TransactionList/TransactionList';
import {dashboardSlice, initialDashboardState, refreshDashboard} from '@/lib/features/dashboard/dashboardSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {DashboardCardSkeleton} from './DashboardSkeleton';
import {DashboardStatsWrapper} from './DashboardStatsWrapper';

function SectionError({message}: {message: string}) {
  return (
    <Card>
      <ErrorAlert error={new Error(message)} />
    </Card>
  );
}

export function DashboardOverview() {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(dashboardSlice.selectors.selectDashboard);
  const {data: session} = authClient.useSession();
  const userId = session?.user.id;
  const refreshUserRef = React.useRef<string | null>(null);
  const visibleDashboard = dashboard.ownerId === userId ? dashboard : initialDashboardState;
  const {
    estimatedBudget,
    latestTransactions,
    upcomingTransactions,
    recurringPaymentOccurrences,
    categoryExpenses,
    status,
  } = visibleDashboard;

  React.useEffect(() => {
    if (!userId || refreshUserRef.current === userId) return;
    refreshUserRef.current = userId;
    if (dashboard.ownerId !== null && dashboard.ownerId !== userId) clearRequestCache();
    void dispatch(refreshDashboard(userId));
  }, [dashboard.ownerId, dispatch, userId]);

  const mapTransactions = (transactions: NonNullable<typeof latestTransactions.data>) =>
    transactions.map(transaction => ({
      ID: transaction.id,
      receiver: transaction.receiver,
      processedAt: transaction.processedAt as Date,
      transferAmount: transaction.transferAmount,
      category: {ID: transaction.category.id, name: transaction.category.name},
      paymentMethod: {ID: transaction.paymentMethod.id, name: transaction.paymentMethod.name},
    }));

  const hasStaleErrors = [
    estimatedBudget,
    latestTransactions,
    upcomingTransactions,
    recurringPaymentOccurrences,
    categoryExpenses,
  ].some(resource => resource.data !== null && resource.error !== null);

  return (
    <>
      <Grid size={{xs: 12}} sx={{height: 2}}>
        {status === 'refreshing' && <LinearProgress aria-label="Refreshing dashboard" sx={{height: 2}} />}
      </Grid>

      {hasStaleErrors && (
        <Grid size={{xs: 12}}>
          <ErrorAlert
            severity="warning"
            error="Some dashboard data could not be refreshed. Showing the last available values."
          />
        </Grid>
      )}

      {estimatedBudget.data ? (
        <DashboardStatsWrapper estimated={estimatedBudget.data} />
      ) : estimatedBudget.error ? (
        <Grid size={{xs: 12}}>
          <SectionError message={estimatedBudget.error} />
        </Grid>
      ) : (
        <DashboardStatsWrapper />
      )}

      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 3, md: 1},
        }}
      >
        {recurringPaymentOccurrences.data ? (
          <RecurringPaymentList
            title="Upcoming recurring payments"
            subtitle="Your upcoming recurring payments"
            data={recurringPaymentOccurrences.data.map(occurrence => ({
              ID: `${occurrence.recurringPayment.id}-${occurrence.scheduledFor}`,
              receiver: occurrence.recurringPayment.receiver,
              nextExecution: parseLocalDateOnly(occurrence.scheduledFor),
              transferAmount: occurrence.recurringPayment.transferAmount,
              category: {
                ID: occurrence.recurringPayment.category.id,
                name: occurrence.recurringPayment.category.name,
              },
              paymentMethod: {
                ID: occurrence.recurringPayment.paymentMethod.id,
                name: occurrence.recurringPayment.paymentMethod.name,
              },
            }))}
            noResultsMessage="You don't have any upcoming recurring payments"
          />
        ) : recurringPaymentOccurrences.error ? (
          <SectionError message={recurringPaymentOccurrences.error} />
        ) : (
          <DashboardCardSkeleton title="Upcoming recurring payments" subtitle="Your upcoming recurring payments" />
        )}
      </Grid>

      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 1, md: 2},
        }}
      >
        <Stack spacing={2}>
          {categoryExpenses.data ? (
            <CategoryExpenseChart initialData={categoryExpenses.data} />
          ) : categoryExpenses.error ? (
            <SectionError message={categoryExpenses.error} />
          ) : (
            <DashboardCardSkeleton title="Category Expenses" subtitle="Expenses per category" chart />
          )}

          {estimatedBudget.data ? (
            <BudgetPieChart
              initialData={{
                expenses: estimatedBudget.data.expenses.paid,
                upcomingExpenses: estimatedBudget.data.expenses.upcoming,
                freeAmount: estimatedBudget.data.freeAmount,
              }}
            />
          ) : estimatedBudget.error ? (
            <SectionError message={estimatedBudget.error} />
          ) : (
            <DashboardCardSkeleton title="Budget" subtitle="How much can you spend?" chart />
          )}
        </Stack>
      </Grid>

      <Grid
        size={{xs: 12, md: 6, lg: 4}}
        sx={{
          order: {xs: 2, md: 3},
        }}
      >
        <Stack spacing={2}>
          {latestTransactions.data ? (
            <TransactionList
              title="Transactions"
              subtitle="Your latest transactions"
              data={mapTransactions(latestTransactions.data)}
              headerAction={
                <IntentButton
                  intent={{entity: 'transaction', action: 'create'}}
                  iconButton
                  aria-label="Create Transaction"
                  color="primary"
                >
                  <AddIcon />
                </IntentButton>
              }
              noResultsMessage="You haven't made any transactions yet"
            />
          ) : latestTransactions.error ? (
            <SectionError message={latestTransactions.error} />
          ) : (
            <DashboardCardSkeleton title="Transactions" subtitle="Your latest transactions" />
          )}

          {upcomingTransactions.data ? (
            <TransactionList
              title="Transactions"
              subtitle="Your upcoming transactions"
              data={mapTransactions(upcomingTransactions.data)}
              headerAction={
                <IntentButton
                  intent={{entity: 'transaction', action: 'create'}}
                  iconButton
                  aria-label="Create Transaction"
                  color="primary"
                >
                  <AddIcon />
                </IntentButton>
              }
              noResultsMessage="You don't have any upcoming transactions for this month"
            />
          ) : upcomingTransactions.error ? (
            <SectionError message={upcomingTransactions.error} />
          ) : (
            <DashboardCardSkeleton title="Transactions" subtitle="Your upcoming transactions" />
          )}
        </Stack>
      </Grid>
      <Box component="span" sx={{display: 'none'}} aria-live="polite">
        {status === 'refreshing' ? 'Refreshing dashboard data' : ''}
      </Box>
    </>
  );
}
