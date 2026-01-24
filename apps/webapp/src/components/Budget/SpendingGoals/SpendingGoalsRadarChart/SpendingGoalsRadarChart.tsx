'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import {Alert, AlertTitle, Stack} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {RadarChart} from '@/components/Charts';
import type {RadarChartSeries} from '@/components/Charts/RadarChart';
import {ErrorAlert} from '@/components/ErrorAlert';
import {Formatter} from '@/utils/Formatter';

export type TSpendingGoalsRadarChartProps = {
  budgets: TBudget[];
  error?: Error | null;
};

export const SpendingGoalsRadarChart: React.FC<TSpendingGoalsRadarChartProps> = ({budgets, error}) => {
  const chartData: {
    series: RadarChartSeries[];
    metrics: {name: string}[];
  } = React.useMemo(() => {
    const spendingGoal = budgets.map(budget => budget.budget);
    const actualSpending = budgets.map(budget => budget.balance);
    const valueFormatter = (value: number) => Formatter.currency.formatBalance(value);
    const series: RadarChartSeries[] = [
      {label: 'Goal', data: spendingGoal, valueFormatter},
      {label: 'Actual', data: actualSpending, valueFormatter},
    ];
    return {
      series,
      metrics: budgets.map(budget => ({
        name: budget.name,
        max: budget.budget * 1.1,
      })),
    };
  }, [budgets]);
  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Stack>
          <Card.Title>Spending goals</Card.Title>
          <Card.Subtitle>Quick budget overview</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        {error !== null && <ErrorAlert error={error} sx={{mx: 2, mb: 1}} />}
        {budgets.length < 3 ? (
          <Alert severity={'info'} sx={{mx: 2, mb: 2}}>
            <AlertTitle>Not enough data points</AlertTitle>
            There are not enough budgets to display the spending goals radar chart. Please create at least 3 budgets to
            see the comparison.
          </Alert>
        ) : (
          <RadarChart
            highlight="series"
            slotProps={{tooltip: {trigger: 'axis'}}}
            fullWidth
            showMarker
            fillArea
            radar={{
              startAngle: 30,
              metrics: chartData.metrics,
            }}
            series={chartData.series}
          />
        )}
      </Card.Body>
    </Card>
  );
};
