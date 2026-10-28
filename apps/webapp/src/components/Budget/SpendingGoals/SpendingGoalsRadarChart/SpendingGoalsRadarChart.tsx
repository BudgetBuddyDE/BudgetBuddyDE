'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import {RadarChart} from '@budgetbuddyde/charts';
import {Alert, AlertTitle, Stack} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {Card} from '@/components/Card';
import {ErrorAlert} from '@/components/ErrorAlert';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';

export type TSpendingGoalsRadarChartProps = {
  budgets: TBudget[];
  error?: Error | null;
};

export const SpendingGoalsRadarChart: React.FC<TSpendingGoalsRadarChartProps> = ({budgets, error}) => {
  const currency = useCurrencyPreference();
  const t = useTranslations('SpendingGoals');
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
          <Card.Title>{t('title')}</Card.Title>
          <Card.Subtitle>{t('subtitle')}</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        {error !== null && <ErrorAlert error={error} sx={{mx: 2, mb: 1}} />}
        {budgets.length < 3 ? (
          <Alert severity={'info'} sx={{mx: 2, mb: 2}}>
            <AlertTitle>{t('notEnough')}</AlertTitle>
            {t('explanation')}
          </Alert>
        ) : (
          <RadarChart
            data={chartData}
            metricKey="metric"
            fillArea
            showMarkers
            startAngle={30}
            valueFormatter={value => Formatter.currency.formatBalance(value, currency)}
            series={[
              {key: 'Goal', label: t('goal'), role: 'target'},
              {key: 'Actual', label: t('actual'), role: 'balance'},
            ]}
          />
        )}
      </Card.Body>
    </Card>
  );
};
