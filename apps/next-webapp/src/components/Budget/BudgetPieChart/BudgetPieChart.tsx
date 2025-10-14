'use client';

import { Box } from '@mui/material';
import React from 'react';
import { Card } from '@/components/Card';
import { PieChart } from '@/components/Charts';
import { CircularProgress } from '@/components/Loading';
import { NoResults } from '@/components/NoResults';
import { Formatter } from '@/utils/Formatter';
import { EntityService } from '@/services/Entity.service';
import { MonthlyKPIResponse } from '@/types';
import { useFetch } from '@/hooks/useFetch';

export type BudgetStats = {
  expenses: number;
  freeAmount: number;
  upcomingExpenses: number;
};

export type BudgetPieChartProps = {};

/**
 * Renders a pie chart component for displaying budget information.
 *
 * @component
 * @example
 * ```tsx
 * <BudgetPieChart />
 * ```
 */
export const BudgetPieChart: React.FC<BudgetPieChartProps> = () => {
  const { isLoading, data, error } = useFetch<BudgetStats>(async () => {
    const records = await EntityService.newOdataHandler()
      .get('/odata/v4/backend/MonthlyKPI')
      .query();
    const parsingResult = MonthlyKPIResponse.safeParse(records);
    if (parsingResult.error) {
      throw parsingResult.error;
    }

    const { paidExpenses, upcomingExpenses, receivedIncome, upcomingIncome } = parsingResult.data;
    return {
      expenses: paidExpenses,
      upcomingExpenses: upcomingExpenses,
      freeAmount: receivedIncome + upcomingIncome - (paidExpenses + upcomingExpenses),
    };
  });

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
    ].filter(({ value }) => value > 0);
  }, [data]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Budget</Card.Title>
          <Card.Subtitle>How much can you spend?</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{ pt: 1 }}>
        {isLoading || !data ? (
          <CircularProgress />
        ) : chartData.length > 0 ? (
          <PieChart
            fullWidth
            primaryText={Formatter.currency.formatBalance(data!.expenses + data!.upcomingExpenses)}
            secondaryText="Expenses"
            series={[
              {
                data: chartData,
                valueFormatter: (value) => Formatter.currency.formatBalance(value.value),
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
