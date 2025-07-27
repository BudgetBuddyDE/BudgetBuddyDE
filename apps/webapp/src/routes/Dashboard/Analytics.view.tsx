import {Button, Grid2 as Grid} from '@mui/material';
import React from 'react';

import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {CategorizedTransactionsBarChart} from '@/features/Analytics';
import {BudgetDrawer, type TBudgetDrawerValues} from '@/features/Budget/BudgetDrawer';
import {BudgetList, TBudgetListProps} from '@/features/Budget/BudgetList';
import {BudgetService} from '@/features/Budget/BudgetService';
import {useBudgets} from '@/features/Budget/useBudgets.hook';
import {CategoryExpenseChart, CategoryIncomeChart, type TCategoryAutocompleteOption} from '@/features/Category';
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
      dispatchBudgetDrawer({type: 'OPEN', drawerAction: 'CREATE', payload: {type: 'i'}});
    },
    onEditBudget: budget => {
      const autocompleteValues: TCategoryAutocompleteOption[] = budget.toCategories.map(category => ({
        ID: category.toCategory.ID,
        name: category.toCategory.name,
      }));
      dispatchBudgetDrawer({
        type: 'OPEN',
        drawerAction: 'UPDATE',
        payload: {
          ID: budget.ID,
          type: budget.type,
          name: budget.name,
          budget: budget.budget,
          categoryAutocomplete: autocompleteValues,
          toCategories: budget.toCategories,
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

        const success = await BudgetService.deleteBudget(selectedBudget.ID);
        if (!success) {
          showSnackbar({
            message: 'Failed to delete the budget ' + selectedBudget.name,
            action: <Button onClick={handler.onConfirmBudgetDelete}>Retry</Button>,
          });
          return;
        }

        showSnackbar({message: `Budget '${selectedBudget.name}' deleted!`});
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
      {/* <DashboardStatsWrapper /> */}

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
