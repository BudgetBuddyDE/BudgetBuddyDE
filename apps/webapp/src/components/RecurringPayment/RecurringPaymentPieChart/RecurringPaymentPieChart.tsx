'use client';

import type {TCategory} from '@budgetbuddyde/api/category';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {Box, Button, Stack, ToggleButton, ToggleButtonGroup} from '@mui/material';
import NextLink from 'next/link';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {PieChart, type PieChartData} from '@/components/Charts';
import {ErrorAlert as ErrorComp} from '@/components/ErrorAlert';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {Formatter} from '@/utils/Formatter';

export type RecurringPaymentType = 'INCOME' | 'EXPENSE';

type RecurringPaymentStats = {
  category: Pick<TCategory, 'id' | 'name'>;
  value: number;
};

const RECURRING_PAYMENT_TYPES: readonly RecurringPaymentType[] = ['INCOME', 'EXPENSE'] as const;

const RECURRING_PAYMENT_TYPE_META: Record<RecurringPaymentType, {label: string; emptyText: string}> = {
  INCOME: {
    label: 'Income',
    emptyText: 'No recurring income found!',
  },
  EXPENSE: {
    label: 'Expenses',
    emptyText: 'No recurring expenses found!',
  },
} as const;

type State<Key extends string | number | symbol> = {
  data: Partial<Record<Key, RecurringPaymentStats[]>>;
  isLoading: boolean;
  error: Error | null;
};

type Action =
  | {type: 'start'; paymentType: RecurringPaymentType}
  | {
      type: 'success';
      paymentType: RecurringPaymentType;
      payload: RecurringPaymentStats[];
    }
  | {type: 'error'; error: Error};

const initialState: State<RecurringPaymentType> = {
  data: {},
  isLoading: true,
  error: null,
};

function reducer(state: State<RecurringPaymentType>, action: Action): State<RecurringPaymentType> {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'success':
      return {
        data: {...state.data, [action.paymentType]: action.payload},
        isLoading: false,
        error: null,
      };
    case 'error':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    default:
      return state;
  }
}

export type RecurringPaymentPieChartProps = {
  withViewMore?: boolean;
};

export const RecurringPaymentPieChart: React.FC<RecurringPaymentPieChartProps> = ({withViewMore = false}) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [recurringPaymentType, setRecurringPaymentType] = React.useState<RecurringPaymentType>('INCOME');

  const fetchData = React.useCallback(
    async (type: RecurringPaymentType) => {
      // Use cached data if available
      if (state.data[type]) return;

      dispatch({type: 'start', paymentType: type});

      try {
        const [recurringPaymentResponse, err] = await apiClient.backend.recurringPayment.getAll(undefined, {
          credentials: 'include',
        });
        if (err) throw err;
        if (!recurringPaymentResponse) {
          throw new Error('No recurring payments received');
        }
        const recurringPayments = (recurringPaymentResponse.data ?? []).filter(
          payment => payment.transferAmount >= 0 === (type === 'INCOME'),
        );
        const categoryStats = groupRecurringPaymentsByCategory(recurringPayments);
        dispatch({
          type: 'success',
          paymentType: type,
          payload: categoryStats,
        });
      } catch (err) {
        dispatch({
          type: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    },
    [state.data],
  );

  // Initial load + when default timeframe changes
  React.useEffect(() => {
    void fetchData(recurringPaymentType);
  }, [recurringPaymentType, fetchData]);

  const stats = state.data[recurringPaymentType];

  const chartData: PieChartData[] = React.useMemo(() => {
    return stats ? toPieData(stats) : [];
  }, [stats]);

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [chartData]);

  const renderContent = () => {
    if (state.isLoading) return <CircularProgress />;
    if (state.error) return <ErrorComp error={state.error} />;
    if (chartData.length === 0) return <NoResults text={RECURRING_PAYMENT_TYPE_META[recurringPaymentType].emptyText} />;

    return (
      <PieChart
        fullWidth
        primaryText={Formatter.currency.formatBalance(totalValue)}
        secondaryText={RECURRING_PAYMENT_TYPE_META[recurringPaymentType].label}
        series={[
          {
            data: chartData,
            valueFormatter: value => Formatter.currency.formatBalance(value.value),
          },
        ]}
      />
    );
  };

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Recurring Payments</Card.Title>
          <Card.Subtitle>Monthly recurring payments</Card.Subtitle>
        </Box>
        <Card.HeaderActions sx={{display: 'flex', flexDirection: 'row'}}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={recurringPaymentType}
            onChange={(_, value: RecurringPaymentType) => setRecurringPaymentType(value)}
            exclusive
          >
            {RECURRING_PAYMENT_TYPES.map(type => {
              const meta = RECURRING_PAYMENT_TYPE_META[type];
              return (
                <ToggleButton key={type} value={type}>
                  {meta.label}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body sx={{pt: 1}}>{renderContent()}</Card.Body>
      {!state.isLoading && withViewMore && (
        <Card.Footer>
          <Stack direction="row" justifyContent="flex-end">
            <Button LinkComponent={NextLink} href="/subscriptions" aria-label="View more subscriptions">
              View more...
            </Button>
          </Stack>
        </Card.Footer>
      )}
    </Card>
  );
};

function groupRecurringPaymentsByCategory(recurringPayments: TExpandedRecurringPayment[]): RecurringPaymentStats[] {
  const grouped = new Map<string, RecurringPaymentStats>();

  for (const payment of recurringPayments) {
    if (payment.paused) continue;

    const absTransferAmount = Math.abs(payment.transferAmount);
    const {id, name} = payment.category;

    if (grouped.has(id)) {
      const existing = grouped.get(id) as RecurringPaymentStats;
      grouped.set(id, {
        category: existing.category,
        value: existing.value + absTransferAmount,
      });
    } else {
      grouped.set(id, {
        category: {id, name},
        value: absTransferAmount,
      });
    }
  }

  return Array.from(grouped.values());
}

function toPieData(stats: RecurringPaymentStats[]): PieChartData[] {
  return stats.map(stat => ({
    label: stat.category.name,
    value: Math.abs(stat.value),
  }));
}
