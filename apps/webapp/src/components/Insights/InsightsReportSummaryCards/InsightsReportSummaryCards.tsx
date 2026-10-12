import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import {Sparkline} from '@budgetbuddyde/charts';
import {
  BalanceRounded,
  ReceiptLongRounded,
  RequestQuoteRounded,
  SavingsRounded,
  TrendingDownRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import {Box, Grid, Typography} from '@mui/material';
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
  timeline?: TInsightsReport['timeline'];
};

export const InsightsReportSummaryCards: React.FC<InsightsReportSummaryCardsProps> = ({summary, timeline = []}) => {
  const savingsRateAvailable = summary.income.value > 0;
  const cards: {
    icon: React.ReactNode;
    label: string;
    metric: SummaryMetric;
    format: (value: number) => string;
    trendKey?: 'expenses' | 'balance';
    unavailable?: boolean;
    hideChange?: boolean;
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
      trendKey: 'expenses',
    },
    {
      icon: <BalanceRounded />,
      label: 'Net. cash flow',
      metric: summary.balance,
      format: Formatter.currency.formatBalance,
      trendKey: 'balance',
    },
    {
      icon: <SavingsRounded />,
      label: 'Savings rate',
      metric: summary.savingsRate,
      format: value => value.toFixed(1) + '%',
      unavailable: !savingsRateAvailable,
      hideChange: !savingsRateAvailable || (summary.income.previousValue ?? 0) <= 0,
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
      metric: summary.averageExpense,
      format: Formatter.currency.formatBalance,
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map(({icon, label, metric, format, trendKey, unavailable, hideChange}) => (
        <Grid key={label} size={{xs: 6, md: 4, lg: 2}}>
          <StatsCard
            icon={icon}
            label={label}
            value={unavailable ? 'N/A' : format(metric.value)}
            valueInformation={unavailable ? 'No recorded income' : hideChange ? undefined : change(metric)}
            trend={
              trendKey && timeline.length >= 2 ? (
                <Box>
                  <Box
                    role="img"
                    aria-label={`${label} trend: ${timeline.map(row => `${row.label}: ${format(row[trendKey])}`).join('; ')}`}
                  >
                    <Box aria-hidden>
                      <Sparkline
                        data={timeline.map(row => row[trendKey])}
                        color={`var(--bb-chart-${trendKey === 'expenses' ? 'expense' : 'balance'})`}
                      />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
                    Trend in selected period · {timeline[0].label} to {timeline[timeline.length - 1].label}
                  </Typography>
                </Box>
              ) : undefined
            }
          />
        </Grid>
      ))}
    </Grid>
  );
};
