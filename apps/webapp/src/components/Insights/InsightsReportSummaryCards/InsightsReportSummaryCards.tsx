import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {Grid} from '@mui/material';
import {useFormatter, useTranslations} from 'next-intl';
import React from 'react';
import {StatsCard} from '@/components/Analytics/StatsCard';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';

type SummaryMetric = TInsightsReport['summary']['income'];

const change = (value: SummaryMetric, formatNumber: (number: number) => string) =>
  value.previousValue === null || value.percentChange === null
    ? undefined
    : (value.percentChange >= 0 ? '+' : '') + formatNumber(value.percentChange / 100);

export type InsightsReportSummaryCardsProps = {
  summary: TInsightsReport['summary'];
};

export const InsightsReportSummaryCards: React.FC<InsightsReportSummaryCardsProps> = ({summary}) => {
  const currency = useCurrencyPreference();
  const formatter = useFormatter();
  const t = useTranslations('InsightsSummary');
  const cards: {
    icon: 'balance' | 'receipt' | 'requestQuote' | 'savings' | 'trendingDown' | 'trendingUp';
    label: string;
    metric: SummaryMetric;
    format: (value: number) => string;
  }[] = [
    {
      icon: 'trendingUp',
      label: t('income'),
      metric: summary.income,
      format: value => Formatter.currency.formatBalance(value, currency),
    },
    {
      icon: 'trendingDown',
      label: t('expenses'),
      metric: summary.expenses,
      format: value => Formatter.currency.formatBalance(value, currency),
    },
    {
      icon: 'balance',
      label: t('netCashFlow'),
      metric: summary.balance,
      format: value => Formatter.currency.formatBalance(value, currency),
    },
    {
      icon: 'savings',
      label: t('savingsRate'),
      metric: summary.savingsRate,
      format: value => formatter.number(value / 100, {style: 'percent', maximumFractionDigits: 1}),
    },
    {
      icon: 'receipt',
      label: t('transactions'),
      metric: summary.transactionCount,
      format: value => String(value),
    },
    {
      icon: 'requestQuote',
      label: t('averageExpense'),
      metric: summary.expenses,
      format: value => Formatter.currency.formatBalance(value, currency),
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map(({icon, label, metric, format}) => (
        <Grid key={label} size={{xs: 6, md: 4, lg: 2}}>
          <StatsCard
            icon={icon}
            label={label}
            value={format(metric.value)}
            valueInformation={change(metric, value =>
              formatter.number(value, {style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1}),
            )}
          />
        </Grid>
      ))}
    </Grid>
  );
};
