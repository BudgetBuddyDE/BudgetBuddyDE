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
      title={t('charts.comparison')}
      description={t('charts.barsBudgetTargetsAndCashFlowBridgesForComparingValuesAcrossCategoriesAndTime')}
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.budgetVsActual')} subtitle={t('charts.groupedBarChart')}>
          <BarChart
            data={budgetVsActual}
            xKey="category"
            series={[
              {key: 'budget', label: t('charts.budget'), role: 'target'},
              {key: 'actual', label: t('charts.actual'), role: 'balance'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.spendingByCategory')} subtitle={t('charts.stackedBarChart')}>
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
        <ChartCard title={t('charts.topCategories')} subtitle={t('charts.horizontalBarChart')}>
          <BarChart
            data={spendingByCategory}
            xKey="label"
            series={[{key: 'value', label: t('charts.spent')}]}
            horizontal
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            height={280}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.monthlyNet')} subtitle={t('charts.negativeValuesWithZeroBaseline')}>
          <BarChart
            data={cashflow}
            xKey="month"
            series={[{key: 'net', label: t('charts.net')}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showZeroLine
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.cashFlowBridge')} subtitle={t('charts.waterfallChart')}>
          <WaterfallChart data={waterfallData} valueFormatter={formatCompactCurrency} height={320} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.budgetUtilization')} subtitle={t('charts.bulletChartActualVsTargetWithinRange')}>
          <BulletChart data={bulletBudgets} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
