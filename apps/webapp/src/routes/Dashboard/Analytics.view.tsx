import {Button, Grid2 as Grid} from '@mui/material';
import React from 'react';

import {DashboardStatsWrapper} from '@/components/DashboardStatsWrapper';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {CategorizedTransactionsBarChart} from '@/features/Analytics';
import {BudgetDrawer, type TBudgetDrawerValues} from '@/features/Budget/BudgetDrawer';
import {BudgetList, TBudgetListProps} from '@/features/Budget/BudgetList';
import {BudgetService} from '@/features/Budget/BudgetService';
import {useBudgets} from '@/features/Budget/useBudgets.hook';
import {CategoryExpenseChart, CategoryIncomeChart} from '@/features/Category';
import {DeleteDialog} from '@/features/DeleteDialog';
import {useSnackbarContext} from '@/features/Snackbar';
import {SubscriptionPieChart} from '@/features/Subscription';
import {logger} from '@/logger';

interface IAnalyticsHandler extends TBudgetListProps {
  onCloseBudgetDrawer: () => void;
  onConfirmBudgetDelete: () => void;
  onCancelBudgetDelete: () => void;
}

const AnalyticsView = () => {
  const {showSnackbar} = useSnackbarContext();

  const {refreshData: refreshBudgets} = useBudgets();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<Parameters<IAnalyticsHandler['onDeleteBudget']>[0] | null>(
    null,
  );
  const [budgetDrawer, dispatchBudgetDrawer] = React.useReducer(
    useEntityDrawer<TBudgetDrawerValues>,
    UseEntityDrawerDefaultState<TBudgetDrawerValues>(),
  );

  const handler: IAnalyticsHandler = {
    onCloseBudgetDrawer: () => {
      dispatchBudgetDrawer({type: 'CLOSE'});
    },
    onAddBudget: () => {
      dispatchBudgetDrawer({type: 'OPEN', drawerAction: 'CREATE', payload: {type: 'include'}});
    },
    onEditBudget: budget => {
      dispatchBudgetDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {
          id: budget.id,
          categories: budget.expand.categories.map(({id, name}) => ({value: id, label: name})),
          label: budget.label,
          type: 'include',
          budget: budget.budget,
        },
      });
    },
    onDeleteBudget: budgetId => {
      setShowDeleteDialog(true);
      setSelectedBudget(budgetId);
    },
    onConfirmBudgetDelete: async () => {
      setShowDeleteDialog(false);
      try {
        if (!selectedBudget) {
          throw new Error('No budget selected');
        }

        const [success, err] = await BudgetService.deleteBudget({id: selectedBudget.id});
        if (err) throw err;

        if (!success) {
          showSnackbar({
            message: 'Failed to delete the budget',
            action: <Button onClick={handler.onConfirmBudgetDelete}>Retry</Button>,
          });
          return;
        }

        showSnackbar({message: `Budget '${selectedBudget.label}' deleted!`});
        React.startTransition(() => {
          refreshBudgets();
        });
        setShowDeleteDialog(false);
        setSelectedBudget(null);
      } catch (err) {
        logger.error("Coudln't delete the budget", err);
      }
    },
    onCancelBudgetDelete: () => {
      setShowDeleteDialog(false);
      setSelectedBudget(null);
    },
    onClickBudget(e, budget) {
      e.stopPropagation();
      e.preventDefault();
      console.log(budget);
    },
  };

  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      <Grid size={{xs: 12, md: 6}}>
        <CategorizedTransactionsBarChart />
      </Grid>

      <Grid size={{xs: 12, md: 6}}>
        <BudgetList
          onAddBudget={handler.onAddBudget}
          onEditBudget={handler.onEditBudget}
          onDeleteBudget={handler.onDeleteBudget}
          onClickBudget={handler.onClickBudget}
        />
      </Grid>

      {[
        {key: 'monthly-balance-pie-chart', children: <SubscriptionPieChart />},
        {key: 'category-income-pie-chart', children: <CategoryIncomeChart withViewMore />},
        {key: 'category-expense-pie-chart', children: <CategoryExpenseChart withViewMore />},
      ].map(({key, children}) => (
        <Grid key={key} size={{xs: 12, md: 4}}>
          {children}
        </Grid>
      ))}

      <DeleteDialog
        open={showDeleteDialog}
        onClose={handler.onCancelBudgetDelete}
        onCancel={handler.onCancelBudgetDelete}
        onConfirm={handler.onConfirmBudgetDelete}
        withTransition
      />

      <BudgetDrawer {...budgetDrawer} onClose={handler.onCloseBudgetDrawer} closeOnBackdropClick closeOnEscape />
    </React.Fragment>
  );
};

export default AnalyticsView;
