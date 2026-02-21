'use client';

import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import {SsidChartRounded} from '@mui/icons-material';
import {Skeleton, Stack, useTheme} from '@mui/material';
import {subMonths} from 'date-fns';
import React from 'react';
import {apiClient} from '@/apiClient';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {BarLineChart} from '@/components/Charts';
import {ErrorAlert} from '@/components/ErrorAlert';
import {DateRangePicker, type DateRangeState} from '@/components/Form/DateRangePicker';
import {NoResults} from '@/components/NoResults';
import {useFetch} from '@/hooks/useFetch';
import {Formatter} from '@/utils/Formatter';

export type HistoricalBalanceLineChartProps =
  | {
      type: 'BASIC';
    }
  | {
      type: 'GROUPED_BY_CATEGORY';
    };

export const HistoricalBalanceLineChart: React.FC<HistoricalBalanceLineChartProps> = ({type}) => {
  const theme = useTheme();
  const DEFAULT_DATE_RANGE = {
    startDate: subMonths(new Date(), 12),
    endDate: new Date(),
  } satisfies DateRangeState;
  const [dateRange, setDateRange] = React.useState(DEFAULT_DATE_RANGE);
  const fetchDataFunc = React.useCallback(async () => {
    const [results, error] = await apiClient.backend.insights.getHistoricalBalance({
      $dateFrom: dateRange.startDate,
      $dateTo: dateRange.endDate,
    });
    if (error) throw error;
    return results.data;
  }, [dateRange]);
  const {isLoading, data, error} = useFetch<THistoricalBalance[] | THistoricalCategoryBalance[]>(fetchDataFunc);
  const DATE_RANGE_LABELS = React.useMemo(() => {
    if (!data) return [];
    return data.map(({date}) => {
      return Formatter.date.formatWithPattern(date instanceof Date ? date : new Date(date), 'MMM yyyy');
    });
  }, [data]);
  const chartData = React.useMemo(() => {
    const temp = {
      balances: [] as (number | null)[],
      expenses: [] as (number | null)[],
      income: [] as (number | null)[],
    };
    if (!data) return temp;
    for (const {balance, income, expenses} of data) {
      temp.balances.push(balance);
      temp.expenses.push(expenses);
      temp.income.push(income);
    }
    return temp;
  }, [data]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    if (!start || !end) {
      console.warn(
        'HistoricalBalanceLineChart: Both start and end dates must be provided. Reverting to default date range.',
      );
      setDateRange(DEFAULT_DATE_RANGE);
      return;
    }

    setDateRange({startDate: start, endDate: end});
  };

  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Stack>
          <Card.Title>Historical balance</Card.Title>
          <Card.Subtitle>
            {type === 'GROUPED_BY_CATEGORY' ? 'Grouped by date and category' : 'Grouped by date'}
          </Card.Subtitle>
        </Stack>
        <Card.HeaderActions actionPaperProps={{sx: {p: 1}}}>
          {isLoading ? (
            <Skeleton variant={'rounded'} width={300} height={36} />
          ) : (
            <DateRangePicker
              size={'small'}
              defaultValue={DEFAULT_DATE_RANGE}
              slotProps={{
                startDateTicker: {
                  openTo: 'month',
                  view: 'month',
                },
                endDateTicker: {
                  openTo: 'month',
                  view: 'month',
                },
              }}
              onDateRangeChange={handleDateRangeChange}
            />
          )}
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        <ActionPaper>
          {error !== null && <ErrorAlert error={error} sx={{m: 2}} />}
          {isLoading && <Skeleton variant={'rounded'} height={300} />}
          {!isLoading && chartData.balances.length === 0 && (
            <NoResults
              icon={<SsidChartRounded />}
              text={'Create your first transaction to see your data here.'}
              sx={{m: 2}}
            />
          )}
          {!isLoading && chartData.balances.length > 0 && (
            <BarLineChart
              height={300}
              xAxis={[
                {
                  scaleType: 'band',
                  data: DATE_RANGE_LABELS,
                },
              ]}
              yAxis={[
                {
                  valueFormatter,
                },
              ]}
              series={[
                {
                  type: 'line',
                  connectNulls: true,
                  data: chartData.balances,
                  showMark: true,
                  color: theme.palette.primary.dark,
                  label: 'Balance',
                  valueFormatter,
                },
                {
                  type: 'bar',
                  data: chartData.expenses,
                  color: theme.palette.error.dark,
                  label: 'Expenses',
                  valueFormatter,
                },
                {
                  data: chartData.income,
                  type: 'bar',
                  color: theme.palette.success.dark,
                  label: 'Income',
                  valueFormatter,
                },
              ]}
            />
          )}
        </ActionPaper>
      </Card.Body>
    </Card>
  );
};

function valueFormatter(value: number | null) {
  return Formatter.currency.formatBalance(value ?? 0);
}
