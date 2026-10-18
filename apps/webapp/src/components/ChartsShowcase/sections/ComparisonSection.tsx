'use client';

import {BarChart, BulletChart, WaterfallChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {
  CATEGORIES,
  budgetVsActual,
  bulletBudgets,
  cashflow,
  categoryStack,
  spendingByCategory,
  waterfallData,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

export const ComparisonSection: React.FC = () => {
  const t = useAppTranslations();
  const {formatBalance: formatCurrency, shortenBalance: formatCompactCurrency} = useCurrencyFormatter();
  return (
    <ShowcaseSection
      title={t('Comparison')}
      description={t('Bars, budget targets and cash flow bridges for comparing values across categories and time.')}
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Budget vs. actual')} subtitle={t('Grouped bar chart')}>
          <BarChart
            data={budgetVsActual}
            xKey="category"
            series={[
              {key: 'budget', label: t('Budget'), role: 'target'},
              {key: 'actual', label: t('Actual'), role: 'balance'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Spending by category')} subtitle={t('Stacked bar chart')}>
          <BarChart
            data={categoryStack}
            xKey="month"
            series={CATEGORIES.map(key => ({key, label: key}))}
            stacked
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Top categories')} subtitle={t('Horizontal bar chart')}>
          <BarChart
            data={spendingByCategory}
            xKey="label"
            series={[{key: 'value', label: t('Spent')}]}
            horizontal
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            height={280}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Monthly net')} subtitle={t('Negative values with zero baseline')}>
          <BarChart
            data={cashflow}
            xKey="month"
            series={[{key: 'net', label: t('Net')}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showZeroLine
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Cash flow bridge')} subtitle={t('Waterfall chart')}>
          <WaterfallChart data={waterfallData} valueFormatter={formatCompactCurrency} height={320} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Budget utilization')} subtitle={t('Bullet chart: actual vs. target within range')}>
          <BulletChart data={bulletBudgets} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
