import {type TCategory} from '@budgetbuddyde/types';
import {Box, Grid2 as Grid} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {BarChart} from '@/components/Base/Charts';
import {FullScreenDialog, type TFullScreenDialogProps} from '@/components/Base/FullScreenDialog';
import {type TDateRange} from '@/components/Base/Input';
import {TransactionService} from '@/features/Transaction';
import {type TExpandedTransaction} from '@/newTypes';
import {Formatter} from '@/services/Formatter';

import {Controls} from './Controls/Controls.component';
import {InsightsStats} from './InsightsStats';
import {NoData} from './NoData';
import {type TSelectCategoriesOption} from './SelectCategories';
import {type TSelectDataOption} from './SelectData';

export type TInsightsChartData = {
  name: string;
  data: number[];
};

export type TState = {
  type: TSelectDataOption;
  dateRange: TDateRange;
  categories: TSelectCategoriesOption[];
  transactions: TExpandedTransaction[];
};

export type TStateAction =
  | {action: 'SET_DATE_RANGE'; range: TState['dateRange']}
  | {action: 'SET_TYPE'; type: TState['type']}
  | {action: 'SET_TRANSACTIONS'; transactions: TState['transactions']}
  | {action: 'SET_CATEGORIES'; categories: TState['categories']}
  | {action: 'RESET'};

function StateReducer(state: TState, action: TStateAction): TState {
  switch (action.action) {
    case 'SET_DATE_RANGE':
      return {...state, dateRange: action.range};

    case 'SET_TYPE':
      return {...state, type: action.type};

    case 'SET_TRANSACTIONS':
      return {...state, transactions: action.transactions};

    case 'SET_CATEGORIES':
      return {...state, categories: action.categories};

    case 'RESET':
      return {
        type: 'EXPENSES',
        categories: [],
        transactions: [],
        dateRange: {startDate: new Date(new Date().getFullYear(), 0, 1), endDate: new Date()},
      };

    default:
      throw new Error('Trying to execute unknown action');
  }
}

export type TInsightsDialogProps = {
  defaultValues?: Omit<TState, 'transactions'>;
} & Pick<TFullScreenDialogProps, 'open' | 'onClose'>;

export const InsightsDialog: React.FC<TInsightsDialogProps> = ({open, onClose, defaultValues}) => {
  const [state, dispatch] = React.useReducer(StateReducer, {
    ...defaultValues,
    showStats: false,
    transactions: [],
  } as TState);

  const dateRangeLabels: string[] = React.useMemo(() => {
    const {dateRange} = state;
    const labels: string[] = [];

    let tempDate = new Date(dateRange.startDate);
    while (tempDate <= dateRange.endDate) {
      labels.push(format(tempDate, 'yyyy-MM'));
      tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1);
    }
    return labels;
  }, [state.dateRange]);

  const chartData: TInsightsChartData[] = React.useMemo(() => {
    const stats: Map<TCategory['id'], {name: string; data: Map<string, number>}> = new Map();
    for (const {
      processedAt,
      toCategory: {ID: categoryId, name: categoryName},
      transferAmount,
    } of state.transactions) {
      const dateKey = format(processedAt, 'yyyy-MM');
      if (stats.has(categoryId)) {
        const {data} = stats.get(categoryId)!;

        if (data.has(dateKey)) {
          const sum = data.get(dateKey)!;
          data.set(dateKey, sum + Math.abs(transferAmount));
        } else {
          data.set(dateKey, Math.abs(transferAmount));
        }
      } else {
        stats.set(categoryId, {name: categoryName, data: new Map([[dateKey, Math.abs(transferAmount)]])});
      }
    }

    // Ensure every month has a value for each category
    for (const [, {data}] of stats) {
      for (const label of dateRangeLabels) {
        if (!data.has(label)) {
          data.set(label, 0);
        }
      }
    }

    // Now transform map to chart data
    return Array.from(stats).map(([, {name, data}]) => ({
      name,
      data: dateRangeLabels.map(label => data.get(label) ?? 0),
    }));
  }, [state.transactions]);

  const stats = React.useMemo(() => {
    return chartData.map(({name, data}) => {
      const total = data.reduce((acc, val) => acc + val, 0);
      return {
        name,
        total,
        average: total / data.length,
      };
    });
  }, [chartData]);

  const fetchData = React.useCallback(async () => {
    const {categories, dateRange, type} = state;
    if (categories.length === 0) return;
    const transactions = await TransactionService.getTransactions({
      $filter: `processedAt ge ${format(dateRange.startDate, 'yyyy-MM-dd')} and processedAt le ${format(dateRange.endDate, 'yyyy-MM-dd')} and transferAmount ${type == 'INCOME' ? 'gt' : 'lt'} 0 and toCategory_ID in (${categories.map(category => `'${category.value}'`).join(',')})`,
    });
    dispatch({action: 'SET_TRANSACTIONS', transactions: transactions});
  }, [state.categories, state.dateRange, state.type]);

  const handleClose = () => {
    dispatch({action: 'RESET'});
    onClose();
  };

  React.useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open, state.categories, state.dateRange, state.type]);

  return (
    <FullScreenDialog
      title="Insights"
      open={open}
      onClose={handleClose}
      boxProps={{sx: {display: 'flex', flexDirection: 'column', flex: 1}}}>
      <Controls state={state} dispatch={dispatch} chartData={chartData} />

      <Box sx={{mt: 2, flex: 1}}>
        {state.categories.length > 0 && chartData.length > 0 ? (
          <Grid container spacing={2} sx={{width: '100%', height: '100%'}}>
            <Grid size={{xs: 12, md: 9.5, xl: 10.5}} sx={{width: '100%', height: '99.99%'}}>
              <ActionPaper sx={{width: '100%', height: '100%'}}>
                <BarChart
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: dateRangeLabels.map(dateStr => {
                        const date = new Date(dateStr);
                        return `${Formatter.formatDate().shortMonthName(date)} ${date.getFullYear()}`;
                      }),
                    },
                  ]}
                  yAxis={[
                    {
                      valueFormatter: value => Formatter.formatBalance(value ?? 0),
                    },
                  ]}
                  series={chartData.map(({name, data}) => ({
                    label: name,
                    data: data,
                    valueFormatter: value => Formatter.formatBalance(value ?? 0),
                  }))}
                  margin={{left: 80, right: 8 * 2, top: 8 * 3, bottom: 8 * 4}}
                  grid={{horizontal: true}}
                />
              </ActionPaper>
            </Grid>
            <Grid size={{xs: 12, md: 2.5, xl: 1.5}}>
              <InsightsStats stats={stats} />
            </Grid>
          </Grid>
        ) : (
          <NoData message={state.categories.length === 0 ? 'No categories selected' : 'No data available'} />
        )}
      </Box>
    </FullScreenDialog>
  );
};
