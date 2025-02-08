import {type TCategory} from '@budgetbuddyde/types';
import {Box, Button, Grid2 as Grid} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {BarChart} from '@/components/Base/Charts';
import {DashboardStatsWrapper} from '@/components/DashboardStatsWrapper';
import {UseEntityDrawerDefaultState, useEntityDrawer} from '@/components/Drawer/EntityDrawer';
import {CircularProgress} from '@/components/Loading';
import {BudgetDrawer, TBudgetDrawerValues} from '@/features/Budget/BudgetDrawer';
import {BudgetList, TBudgetListProps} from '@/features/Budget/BudgetList';
import {BudgetService} from '@/features/Budget/BudgetService';
import {useBudgets} from '@/features/Budget/useBudgets.hook';
import {CategoryExpenseChart, CategoryIncomeChart} from '@/features/Category';
import {DeleteDialog} from '@/features/DeleteDialog';
import {useSnackbarContext} from '@/features/Snackbar';
import {SubscriptionPieChart} from '@/features/Subscription';
import {useTransactions} from '@/features/Transaction';
import {useScreenSize} from '@/hooks/useScreenSize';
import {logger} from '@/logger';
import {Formatter} from '@/services/Formatter';

enum Prefix {
  Income = 'income_',
  Expense = 'expense_',
}
type TChartData = {
  series: {
    dataKey: `${Prefix}${TCategory['id']}`;
    label: TCategory['name'];
    stack: 'income' | 'expense';
    valueFormatter: (v: number | null) => string;
  }[];
  data: ({
    date: Date;
  } & Record<`${Prefix}${TCategory['id']}`, number>)[];
};

interface IAnalyticsHandler extends TBudgetListProps {
  onCloseBudgetDrawer: () => void;
  onConfirmBudgetDelete: () => void;
  onCancelBudgetDelete: () => void;
}

const AnalyticsView = () => {
  const screenSize = useScreenSize();
  const {showSnackbar} = useSnackbarContext();
  const {isLoading: isLoadingTransactions, data: transactions} = useTransactions();
  const {refreshData: refreshBudgets} = useBudgets();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<Parameters<IAnalyticsHandler['onDeleteBudget']>[0] | null>(
    null,
  );
  const [budgetDrawer, dispatchBudgetDrawer] = React.useReducer(
    useEntityDrawer<TBudgetDrawerValues>,
    UseEntityDrawerDefaultState<TBudgetDrawerValues>(),
  );

  const ChartData: TChartData = React.useMemo(() => {
    if (!transactions) return {series: [], data: []};

    const translations = new Map<`${Prefix}${TCategory['id']}`, TCategory['name']>();
    const temp = new Map<
      string,
      {
        income: Map<TCategory['id'], number>;
        expense: Map<TCategory['id'], number>;
      }
    >(); // key => year-month

    for (const {
      processed_at,
      transfer_amount,
      expand: {
        category: {id: categoryId, name: categoryName},
      },
    } of transactions) {
      const mapKey = format(processed_at, 'yyyy-MM');
      const isIncome = transfer_amount > 0;
      const absTransAmnt = Math.abs(transfer_amount);

      if (!translations.has(`${isIncome ? Prefix.Income : Prefix.Expense}${categoryId}`)) {
        translations.set(`${isIncome ? Prefix.Income : Prefix.Expense}${categoryId}`, categoryName);
      }

      if (temp.has(mapKey)) {
        const currValue = temp.get(mapKey)!;
        const targetMap = currValue[isIncome ? 'income' : 'expense'];
        const nonTargetMap = currValue[isIncome ? 'expense' : 'income'];

        if (targetMap.has(categoryId)) {
          const currSum = targetMap.get(categoryId) ?? 0;
          targetMap.set(categoryId, currSum + absTransAmnt);
        } else targetMap.set(categoryId, absTransAmnt);

        temp.set(mapKey, {
          income: isIncome ? targetMap : nonTargetMap,
          expense: isIncome ? nonTargetMap : targetMap,
        });
      } else {
        temp.set(mapKey, {
          income: new Map<string, number>(isIncome ? [[categoryId, absTransAmnt]] : []),
          expense: new Map<string, number>(isIncome ? [] : [[categoryId, absTransAmnt]]),
        });
      }
    }

    return {
      series: Array.from(translations).map(([key, value]) => ({
        dataKey: key,
        label: value,
        stack: key.startsWith(Prefix.Income) ? 'income' : 'expense',
        valueFormatter: (v: number | null) => (v ? Formatter.formatBalance(v) : '-'),
      })),
      data: Array.from(temp).map(
        ([key, value]) =>
          ({
            date: new Date(`${key}-01`),
            ...Object.fromEntries(
              Array.from(value.income).map(([id, sum]) => {
                return [`${Prefix.Income}${id}`, sum];
              }),
            ),
            ...Object.fromEntries(
              Array.from(value.expense).map(([id, sum]) => {
                return [`${Prefix.Expense}${id}`, sum];
              }),
            ),
          }) as TChartData['data'][0],
      ),
    };
  }, [transactions]);

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
  };

  return (
    <React.Fragment>
      <DashboardStatsWrapper />

      <Grid size={{xs: 12, md: 6}}>
        <Card>
          <Card.Header>
            <Box>
              <Card.Title>Income & Expenses</Card.Title>
              <Card.Subtitle>Grouped by month</Card.Subtitle>
            </Box>
          </Card.Header>
          <Card.Body>
            {isLoadingTransactions ? (
              <CircularProgress />
            ) : (
              <BarChart
                dataset={ChartData.data}
                series={ChartData.series}
                {...{
                  layout: screenSize === 'small' ? 'horizontal' : 'vertical',
                  [screenSize === 'small' ? 'yAxis' : 'xAxis']: [
                    {
                      scaleType: 'band',
                      dataKey: 'date',
                      valueFormatter: (v: Date) => format(v, 'MMM yyyy'),
                    },
                  ],
                  [screenSize === 'small' ? 'xAxis' : 'yAxis']: [
                    {valueFormatter: (value: string) => Formatter.formatBalance(Number(value))},
                  ],
                }}
                tooltip={{trigger: 'item'}}
                slotProps={{legend: {hidden: true}}}
                margin={{left: 8 * (screenSize === 'small' ? 8 : 10), right: 0, top: 8 * 4, bottom: 8 * 3}}
                height={screenSize === 'small' ? 300 : 400}
              />
            )}
          </Card.Body>
        </Card>
      </Grid>

      <Grid size={{xs: 12, md: 6}}>
        <BudgetList
          onAddBudget={handler.onAddBudget}
          onEditBudget={handler.onEditBudget}
          onDeleteBudget={handler.onDeleteBudget}
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
