import {Box, Button, Grid2 as Grid, Stack} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';
import {DashboardStatsWrapper} from '@/components/DashboardStatsWrapper';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {CircularProgress} from '@/components/Loading';
import {When} from '@/components/When';
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
import {odata} from '@/odata.client';

const LIST_ITEM_COUNT = 6;

const DashboardView = () => {
  useDocumentTitle(`${AppConfig.appName} - Dashboard`, true);
  const {isLoading: isLoadingTransactions, getLatestTransactions, getUpcomingAsTransactions} = useTransactions();
  const {isLoading: isLoadingSubscriptions, getUpcomingSubscriptions} = useSubscriptions();
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

  const postData = async () => {
    const result = await odata
      .get('/odata/v4/backend/Transaction')
      .post('/odata/v4/backend/Category', {
        name: 'New Category' + new Date().toISOString(),
        description: 'This is a new category created via OData client',
      })
      .query();
    console.log('Fetched categories:', result);
  };

  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      <Button onClick={() => postData()}>Submit request</Button>

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 3, md: 1}}>
        <Stack spacing={AppConfig.baseSpacing}>
          {isLoadingSubscriptions ? (
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

        <When when={getUpcomingAsTransactions('EXPENSES').length > 0}>
          <Box sx={{mt: 2}}>
            <TransactionList
              title="Planned payments"
              subtitle="What payments are upcoming?"
              data={getUpcomingAsTransactions('EXPENSES').slice(0, LIST_ITEM_COUNT)}
              onAddTransaction={handler.onAddTransaction}
            />
          </Box>
        </When>
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
