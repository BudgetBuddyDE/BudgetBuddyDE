'use client';

import {Box} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {PieChart} from '@/components/Charts';
import {ErrorAlert} from '@/components/ErrorAlert';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {Formatter} from '@/utils/Formatter';

export type BudgetStats = {
  expenses: number;
  freeAmount: number;
  upcomingExpenses: number;
};

export type BudgetPieChartProps = {
  initialData?: BudgetStats;
};

/**
 * Renders a pie chart component for displaying budget information.
 *
 * @component
 * @example
 * ```tsx
 * <BudgetPieChart />
 * ```
 */
export const BudgetPieChart: React.FC<BudgetPieChartProps> = ({initialData}) => {
  const [data, setData] = React.useState<BudgetStats | null>(initialData ?? null);
  const [isLoading, setIsLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const [estimated, requestError] = await apiClient.backend.budget.getEstimatedBudget();
        if (requestError) throw requestError;
        const result = {
          expenses: estimated.expenses.paid,
          upcomingExpenses: estimated.expenses.upcoming,
          freeAmount: estimated.freeAmount,
        };
        if (active) setData(result);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause : new Error(String(cause)));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialData]);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [
      {
        id: 'current-expenses',
        label: 'Current Expenses',
        value: data.expenses,
      },
      {
        id: 'future-expenses',
        label: 'Future Expenses',
        value: data.upcomingExpenses,
      },
      {
        id: 'free-amount',
        label: 'Free Amount',
        value: data.freeAmount,
      },
    ].filter(({value}) => value > 0);
  }, [data]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Budget</Card.Title>
          <Card.Subtitle>How much can you spend?</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{pt: 1}}>
        {error && <ErrorAlert error={error} />}

        {isLoading || !data ? (
          <CircularProgress />
        ) : chartData.length > 0 ? (
          <PieChart
            fullWidth
            primaryText={Formatter.currency.formatBalance(data?.expenses + data?.upcomingExpenses)}
            secondaryText="Expenses"
            series={[
              {
                data: chartData,
                valueFormatter: value => Formatter.currency.formatBalance(value.value),
              },
            ]}
          />
        ) : (
          <NoResults text="No budget related data found!" />
        )}
      </Card.Body>
    </Card>
  );
};
