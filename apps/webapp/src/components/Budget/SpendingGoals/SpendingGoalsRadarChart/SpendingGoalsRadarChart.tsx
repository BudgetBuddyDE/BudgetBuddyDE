'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import {RadarChart} from '@budgetbuddyde/charts';
import {Alert, AlertTitle, Stack} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {ErrorAlert} from '@/components/ErrorAlert';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';

export type TSpendingGoalsRadarChartProps = {
  budgets: TBudget[];
  error?: Error | null;
};

export const SpendingGoalsRadarChart: React.FC<TSpendingGoalsRadarChartProps> = ({budgets, error}) => {
  const t = useAppTranslations();
  const currencyFormatter = useCurrencyFormatter();
  const chartData = React.useMemo(
    () =>
      budgets.map(budget => ({
        metric: budget.name,
        Goal: budget.budget,
        Actual: budget.balance,
      })),
    [budgets],
  );

  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Stack>
          <Card.Title>{t('Spending goals')}</Card.Title>
          <Card.Subtitle>{t('Quick budget overview')}</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        {error !== null && <ErrorAlert error={error} sx={{mx: 2, mb: 1}} />}
        {budgets.length < 3 ? (
          <Alert severity={'info'} sx={{mx: 2, mb: 2}}>
            <AlertTitle>{t('Not enough data points')}</AlertTitle>
            {t(
              'There are not enough budgets to display the spending goals radar chart. Please create at least 3 budgets to see the comparison.',
            )}
          </Alert>
        ) : (
          <RadarChart
            data={chartData}
            metricKey="metric"
            fillArea
            showMarkers
            startAngle={30}
            valueFormatter={value => currencyFormatter.formatBalance(value)}
            series={[
              {key: 'Goal', label: t('Goal'), role: 'target'},
              {key: 'Actual', label: t('Actual'), role: 'balance'},
            ]}
          />
        )}
      </Card.Body>
    </Card>
  );
};
