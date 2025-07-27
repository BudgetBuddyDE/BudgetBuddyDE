import {Grid2 as Grid, Stack} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';
import {DashboardStatsWrapper} from '@/components/DashboardStatsWrapper';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {BudgetPieChart} from '@/features/Budget';
import {CategoryExpenseChart, UpcomingSubscriptions} from '@/features/Category';
import {SubscriptionDrawer, type TSusbcriptionDrawerValues, UpcomingSubscriptionsList} from '@/features/Subscription';
import {LatestTransactionsList, type TTransactionDrawerValues, TransactionDrawer} from '@/features/Transaction';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';

const DashboardView = () => {
  useDocumentTitle(`${AppConfig.appName} - Dashboard`, true);
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
      {/* <DashboardStatsWrapper /> */}

      <Grid size={{xs: 12, md: 6, lg: 4}} order={{xs: 3, md: 1}}>
        <Stack spacing={AppConfig.baseSpacing}>
          <UpcomingSubscriptionsList onAddEntity={handler.onAddSubscription} />

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
        <LatestTransactionsList onAddEntity={handler.onAddTransaction} />
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
