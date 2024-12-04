import {Box, Grid2 as Grid, Stack} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';
import {DashboardStatsWrapper} from '@/components/DashboardStatsWrapper';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {CircularProgress} from '@/components/Loading';
import {BudgetPieChart} from '@/features/Budget';
import {CategoryExpenseChart, UpcomingSubscriptions} from '@/features/Category';
import {
  SubscriptionDrawer,
  SubscriptionList,
  type TSusbcriptionDrawerValues,
  useSubscriptions,
} from '@/features/Subscription';
import {
  type TTransactionDrawerValues,
  TransactionDrawer,
  TransactionList,
  useTransactions,
} from '@/features/Transaction';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';

const LIST_ITEM_COUNT = 6;

const DashboardView = () => {
  useDocumentTitle(`${AppConfig.appName} - Dashboard`, true);
  const {isLoading: isLoadingTransactions, getLatestTransactions, getUpcomingAsTransactions} = useTransactions();
  const {isLoading: loadingSubscriptions, getUpcomingSubscriptions} = useSubscriptions();
  const [transactionDrawer, dispatchTransactionDrawer] = React.useReducer(
    useEntityDrawer<TTransactionDrawerValues>,
    UseEntityDrawerDefaultState<TTransactionDrawerValues>(),
  );
  const [subscriptionDrawer, dispatchSubscriptionDrawer] = React.useReducer(
    useEntityDrawer<TSusbcriptionDrawerValues>,
    UseEntityDrawerDefaultState<TSusbcriptionDrawerValues>(),
  );

  const handler = {
    onAddSubscription: () => {
      dispatchSubscriptionDrawer({type: 'OPEN', drawerAction: 'CREATE'});
    },
    onAddTransaction: () => {
      dispatchTransactionDrawer({type: 'OPEN', drawerAction: 'CREATE'});
    },
  };

  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 3, md: 1}}>
        <Stack spacing={AppConfig.baseSpacing}>
          {loadingSubscriptions ? (
            <CircularProgress />
          ) : (
            <SubscriptionList
              data={getUpcomingSubscriptions(LIST_ITEM_COUNT)}
              onAddSubscription={handler.onAddSubscription}
            />
          )}

          <UpcomingSubscriptions />
        </Stack>
      </Grid>

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 1, md: 2}}>
        <Stack spacing={AppConfig.baseSpacing}>
          <CategoryExpenseChart />
          <BudgetPieChart />
        </Stack>
      </Grid>

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 2, md: 3}}>
        {isLoadingTransactions ? (
          <CircularProgress />
        ) : (
          <TransactionList
            title="Latest transactions"
            subtitle="What purchases did you make recently?"
            data={getLatestTransactions(LIST_ITEM_COUNT)}
            onAddTransaction={handler.onAddTransaction}
          />
        )}

        <Box sx={{mt: 2}}>
          <TransactionList
            title="Planned payments"
            subtitle="What payments are upcoming?"
            data={getUpcomingAsTransactions('EXPENSES').slice(0, LIST_ITEM_COUNT)}
            onAddTransaction={handler.onAddTransaction}
          />
        </Box>
      </Grid>

      <TransactionDrawer
        {...transactionDrawer}
        onClose={() => dispatchTransactionDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />

      <SubscriptionDrawer
        {...subscriptionDrawer}
        onClose={() => dispatchSubscriptionDrawer({type: 'CLOSE'})}
        closeOnBackdropClick
        closeOnEscape
      />
    </React.Fragment>
  );
};

export default DashboardView;
