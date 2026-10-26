'use client';

import type {TCategory} from '@budgetbuddyde/api/category';
import type {TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import {DonutChart, type DonutDataPoint} from '@budgetbuddyde/charts';
import {Box, Button, Stack, ToggleButton, ToggleButtonGroup} from '@mui/material';
import NextLink from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {ErrorAlert as ErrorComp} from '@/components/ErrorAlert';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';
import {endOfLocalMonthDateOnly, formatLocalDateOnly} from '../dateOnly';

export type RecurringPaymentType = 'INCOME' | 'EXPENSE';

type RecurringPaymentStats = {
  category: Pick<TCategory, 'id' | 'name'>;
  value: number;
};

const RECURRING_PAYMENT_TYPES: readonly RecurringPaymentType[] = ['INCOME', 'EXPENSE'] as const;

const RECURRING_PAYMENT_TYPE_META: Record<RecurringPaymentType, {labelKey: string; emptyKey: string}> = {
  INCOME: {
    labelKey: 'income',
    emptyKey: 'noRecurringIncome',
  },
  EXPENSE: {
    labelKey: 'expenses',
    emptyKey: 'noRecurringExpenses',
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
  const t = useTranslations('RecurringPaymentPieChart');
  const locale = useLocale();
  const currency = useCurrencyPreference();
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [recurringPaymentType, setRecurringPaymentType] = React.useState<RecurringPaymentType>('INCOME');
  const today = new Date();
  const occurrenceViewHref = `/recurringPayments/occurrences?dateFrom=${formatLocalDateOnly(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )}&dateTo=${endOfLocalMonthDateOnly(today)}`;

  const fetchData = React.useCallback(
    async (type: RecurringPaymentType) => {
      // Use cached data if available
      if (state.data[type]) return;

      dispatch({type: 'start', paymentType: type});

      try {
        const today = new Date();
        const dateFrom = formatLocalDateOnly(new Date(today.getFullYear(), today.getMonth(), 1));
        const dateTo = endOfLocalMonthDateOnly(today);
        const [recurringPaymentResponse, err] = await apiClient.backend.recurringPayment.getOccurrences(
          {$dateFrom: dateFrom, $dateTo: dateTo, from: 0, to: 100},
          {credentials: 'include'},
        );
        if (err) throw err;
        if (!recurringPaymentResponse) {
          throw new Error('No recurring payments received');
        }
        const occurrences = [...(recurringPaymentResponse.data ?? [])];
        const totalCount = recurringPaymentResponse.totalCount ?? occurrences.length;
        for (let from = 100; from < totalCount; from += 100) {
          const [page, pageError] = await apiClient.backend.recurringPayment.getOccurrences(
            {$dateFrom: dateFrom, $dateTo: dateTo, from, to: from + 100},
            {credentials: 'include'},
          );
          if (pageError) throw pageError;
          occurrences.push(...(page?.data ?? []));
        }
        const recurringPayments = occurrences.filter(
          occurrence => occurrence.recurringPayment.transferAmount >= 0 === (type === 'INCOME'),
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

  const chartData: DonutDataPoint[] = React.useMemo(() => {
    return stats ? toPieData(stats) : [];
  }, [stats]);

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [chartData]);

  const renderContent = () => {
    if (state.isLoading) return <CircularProgress />;
    if (state.error) return <ErrorComp error={state.error} />;
    if (chartData.length === 0) {
      return <NoResults text={t(RECURRING_PAYMENT_TYPE_META[recurringPaymentType].emptyKey)} />;
    }

    return (
      <DonutChart
        data={chartData}
        primaryText={Formatter.currency.formatBalance(totalValue, currency, 2, 2, locale)}
        secondaryText={t(RECURRING_PAYMENT_TYPE_META[recurringPaymentType].labelKey)}
        valueFormatter={value => Formatter.currency.formatBalance(value, currency, 2, 2, locale)}
      />
    );
  };

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>{t('title')}</Card.Title>
          <Card.Subtitle>{t('subtitle')}</Card.Subtitle>
        </Box>
        <Card.HeaderActions sx={{display: 'flex', flexDirection: 'row'}}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={recurringPaymentType}
            onChange={(_, value: RecurringPaymentType) => setRecurringPaymentType(value)}
            exclusive
            aria-label={t('typeLabel')}
          >
            {RECURRING_PAYMENT_TYPES.map(type => {
              const meta = RECURRING_PAYMENT_TYPE_META[type];
              return (
                <ToggleButton key={type} value={type}>
                  {t(meta.labelKey)}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body sx={{pt: 1}}>{renderContent()}</Card.Body>
      {!state.isLoading && withViewMore && (
        <Card.Footer>
          <Stack
            direction="row"
            sx={{
              justifyContent: 'flex-end',
            }}
          >
            <Button LinkComponent={NextLink} href={occurrenceViewHref} aria-label={t('viewMore')}>
              {t('viewMore')}
            </Button>
          </Stack>
        </Card.Footer>
      )}
    </Card>
  );
};

function groupRecurringPaymentsByCategory(recurringPayments: TRecurringPaymentOccurrence[]): RecurringPaymentStats[] {
  const grouped = new Map<string, RecurringPaymentStats>();

  for (const {recurringPayment: payment} of recurringPayments) {
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

function toPieData(stats: RecurringPaymentStats[]): DonutDataPoint[] {
  return stats.map(stat => ({
    id: stat.category.id,
    label: stat.category.name,
    value: Math.abs(stat.value),
  }));
}
