import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {
  BalanceRounded,
  ReceiptLongRounded,
  RequestQuoteRounded,
  SavingsRounded,
  TrendingDownRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import {Grid} from '@mui/material';
import React from 'react';
import {StatsCard} from '@/components/Analytics/StatsCard';
import {Formatter} from '@/utils/Formatter';

type SummaryMetric = TInsightsReport['summary']['income'];

const change = (value: SummaryMetric) =>
  value.previousValue === null || value.percentChange === null
    ? undefined
    : (value.percentChange >= 0 ? '+' : '') + value.percentChange.toFixed(1) + '%';

export type InsightsReportSummaryCardsProps = {
  summary: TInsightsReport['summary'];
};

export const InsightsReportSummaryCards: React.FC<InsightsReportSummaryCardsProps> = ({summary}) => {
  const cards: {
    icon: React.ReactNode;
    label: string;
    metric: SummaryMetric;
    format: (value: number) => string;
  }[] = [
    {
      icon: <TrendingUpRounded />,
      label: 'Income',
      metric: summary.income,
      format: Formatter.currency.formatBalance,
    },
    {
      icon: <TrendingDownRounded />,
      label: 'Expenses',
      metric: summary.expenses,
      format: Formatter.currency.formatBalance,
    },
    {
      icon: <BalanceRounded />,
      label: 'Net. cash flow',
      metric: summary.balance,
      format: Formatter.currency.formatBalance,
    },
    {
      icon: <SavingsRounded />,
      label: 'Savings rate',
      metric: summary.savingsRate,
      format: value => value.toFixed(1) + '%',
    },
    {
      icon: <ReceiptLongRounded />,
      label: 'Transactions',
      metric: summary.transactionCount,
      format: value => String(value),
    },
    {
      icon: <RequestQuoteRounded />,
      label: 'Average expense',
      metric: summary.expenses,
      format: Formatter.currency.formatBalance,
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map(({icon, label, metric, format}) => (
        <Grid key={label} size={{xs: 6, md: 4, lg: 2}}>
          <StatsCard icon={icon} label={label} value={format(metric.value)} valueInformation={change(metric)} />
        </Grid>
      ))}
    </Grid>
  );
};
