'use client';

import {CandlestickChart, SankeyChart, Sparkline} from '@budgetbuddyde/charts';
import {Box, Grid, Stack, Typography} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {balanceSparkline, cashflow, expensesSparkline, moneyFlow, portfolioPrices} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

export const AdvancedSection: React.FC = () => {
  const t = useAppTranslations();
  const {formatBalance: formatCurrency, shortenBalance: formatCompactCurrency} = useCurrencyFormatter();
  const kpis = [
    {
      label: t('charts.netBalance'),
      value: formatCurrency(9780),
      trend: balanceSparkline,
      color: 'var(--bb-chart-balance)',
      area: true,
    },
    {
      label: t('charts.monthlyExpenses'),
      value: formatCurrency(3000),
      trend: expensesSparkline,
      color: 'var(--bb-chart-expense)',
      area: false,
    },
    {
      label: t('charts.savingsRate'),
      value: `${Math.round((cashflow[cashflow.length - 1].net / cashflow[cashflow.length - 1].income) * 100)}%`,
      trend: cashflow.map(row => Math.round((row.net / row.income) * 100)),
      color: 'var(--bb-chart-income)',
      area: true,
    },
  ];
  return (
    <ShowcaseSection
      title={t('charts.flowsInvestmentsKPIs')}
      description={t('charts.whereTheMoneyGoesHowInvestmentsMoveAndAtAGlanceKeyFigures')}
    >
      <Grid size={{xs: 12, lg: 7}}>
        <ChartCard title={t('charts.moneyFlow')} subtitle={t('charts.sankeyDiagramIncomeCategoriesAndMerchants')}>
          <SankeyChart data={moneyFlow} valueFormatter={formatCurrency} height={360} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 5}}>
        <ChartCard
          title={t('charts.keyFigures')}
          subtitle={t('charts.monthlyTrendsJanuaryToDecember')}
          note={t('charts.eachSparklineUsesItsOwnScaleCompareChangesWithinATrendNotHeightsAcrossCards')}
        >
          <Stack spacing={1.5}>
            {kpis.map(kpi => (
              <Box key={kpi.label} sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                <Box sx={{minWidth: 140}}>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.label}
                  </Typography>
                  <Typography variant="h6" sx={{fontWeight: 700}}>
                    {kpi.value}
                  </Typography>
                </Box>
                <Box sx={{flex: 1, minWidth: 0}}>
                  <Sparkline data={kpi.trend} color={kpi.color} area={kpi.area} height={48} />
                </Box>
              </Box>
            ))}
          </Stack>
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12}}>
        <ChartCard title={t('charts.portfolioPriceHistory')} subtitle={t('charts.candlestickOHLCChart')}>
          <CandlestickChart
            data={portfolioPrices}
            valueFormatter={value => formatCompactCurrency(value)}
            height={320}
          />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
