'use client';

import {AreaChart, ComposedChart, LineChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {CATEGORIES, averageBalance, balanceTrend, cashflow, categoryStack} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

export const TimeSeriesSection: React.FC = () => {
  const t = useAppTranslations();
  const {formatBalance: formatCurrency, shortenBalance: formatCompactCurrency} = useCurrencyFormatter();
  return (
    <ShowcaseSection
      title={t('Time series')}
      description={t('Balances, income and expenses over time - the backbone of financial dashboards.')}
    >
      <Grid size={{xs: 12, lg: 8}}>
        <ChartCard title={t('Balance trend')} subtitle={t('Line chart with average reference line')}>
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: t('Balance'), role: 'balance'}]}
            showDots
            showEndLabel
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            referenceLines={[{y: averageBalance, label: t('Average')}]}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 4}}>
        <ChartCard title={t('Long range with brush')} subtitle={t('Zoom into a range')}>
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: t('Balance'), role: 'balance'}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            brush
            height={300}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Income vs. expenses')} subtitle={t('Synced tooltip (syncId)')}>
          <LineChart
            data={cashflow}
            xKey="month"
            series={[
              {key: 'income', label: t('Income'), role: 'income'},
              {key: 'expenses', label: t('Expenses'), role: 'expense'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
            syncId="cashflow"
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Spending by category')} subtitle={t('Stacked area, synced tooltip (syncId)')}>
          <AreaChart
            data={categoryStack}
            xKey="month"
            series={CATEGORIES.map(key => ({key, label: key}))}
            stacked
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
            syncId="cashflow"
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Cumulative balance')} subtitle={t('Filled area chart')}>
          <AreaChart
            data={balanceTrend}
            xKey="month"
            gradient
            series={[{key: 'balance', label: t('Balance'), role: 'balance'}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard
          title={t('Cashflow overview')}
          subtitle={t('Monthly flows and cumulative balance')}
          note={t(
            'Left axis: monthly income and expenses. Right axis: accumulated balance; heights across axes are not directly comparable.',
          )}
        >
          <ComposedChart
            data={balanceTrend.map((row, index) => ({
              ...row,
              income: cashflow[index].income,
              expenses: cashflow[index].expenses,
            }))}
            xKey="month"
            series={[
              {key: 'income', label: t('Income'), type: 'bar', role: 'income'},
              {key: 'expenses', label: t('Expenses'), type: 'bar', role: 'expense'},
              {key: 'balance', label: t('Balance'), type: 'line', role: 'balance', yAxisId: 'right'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            leftAxisLabel={t('Monthly flow')}
            rightAxisLabel={t('Balance')}
            showZeroLine
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12}}>
        <ChartCard title={t('Detailed income')} subtitle={t('Single series line with full currency tooltip')}>
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: t('Balance'), role: 'balance'}]}
            valueFormatter={formatCurrency}
            showGrid={false}
            height={260}
          />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
