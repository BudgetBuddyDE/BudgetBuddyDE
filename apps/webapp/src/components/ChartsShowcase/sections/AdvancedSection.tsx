import {CandlestickChart, SankeyChart, Sparkline} from '@budgetbuddyde/charts';
import {Box, Grid, Stack, Typography} from '@mui/material';
import React from 'react';
import {
  balanceSparkline,
  cashflow,
  expensesSparkline,
  formatCompactCurrency,
  formatCurrency,
  moneyFlow,
  portfolioPrices,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

const kpis = [
  {
    label: 'Net balance',
    value: formatCurrency(9780),
    trend: balanceSparkline,
    color: 'var(--bb-chart-balance)',
    area: true,
  },
  {
    label: 'Monthly expenses',
    value: formatCurrency(3000),
    trend: expensesSparkline,
    color: 'var(--bb-chart-expense)',
    area: false,
  },
  {
    label: 'Savings rate',
    value: `${Math.round((cashflow[cashflow.length - 1].net / cashflow[cashflow.length - 1].income) * 100)}%`,
    trend: cashflow.map(row => Math.round((row.net / row.income) * 100)),
    color: 'var(--bb-chart-income)',
    area: true,
  },
];

export const AdvancedSection: React.FC = () => {
  return (
    <ShowcaseSection
      title="Flows, investments & KPIs"
      description="Where the money goes, how investments move and at-a-glance key figures."
    >
      <Grid size={{xs: 12, lg: 7}}>
        <ChartCard title="Money flow" subtitle="Sankey diagram: income, categories and merchants">
          <SankeyChart data={moneyFlow} valueFormatter={formatCurrency} height={360} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 5}}>
        <ChartCard
          title="Key figures"
          subtitle="Monthly trends, January to December"
          note="Each sparkline uses its own scale; compare changes within a trend, not heights across cards."
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
        <ChartCard title="Portfolio price history" subtitle="Candlestick / OHLC chart">
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
