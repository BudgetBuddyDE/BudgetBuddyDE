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
      title={t('charts.timeSeries')}
      description={t('charts.balancesIncomeAndExpensesOverTimeTheBackboneOfFinancialDashboards')}
    >
      <Grid size={{xs: 12, lg: 8}}>
        <ChartCard title={t('charts.balanceTrend')} subtitle={t('charts.lineChartWithAverageReferenceLine')}>
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: t('charts.balance'), role: 'balance'}]}
            showDots
            showEndLabel
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            referenceLines={[{y: averageBalance, label: t('charts.average')}]}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 4}}>
        <ChartCard title={t('charts.longRangeWithBrush')} subtitle={t('charts.zoomIntoARange')}>
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: t('charts.balance'), role: 'balance'}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            brush
            height={300}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.incomeVsExpenses')} subtitle={t('charts.syncedTooltipSyncId')}>
          <LineChart
            data={cashflow}
            xKey="month"
            series={[
              {key: 'income', label: t('charts.income'), role: 'income'},
              {key: 'expenses', label: t('charts.expenses'), role: 'expense'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
            syncId="cashflow"
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.spendingByCategory')} subtitle={t('charts.stackedAreaSyncedTooltipSyncId')}>
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
        <ChartCard title={t('charts.cumulativeBalance')} subtitle={t('charts.filledAreaChart')}>
          <AreaChart
            data={balanceTrend}
            xKey="month"
            gradient
            series={[{key: 'balance', label: t('charts.balance'), role: 'balance'}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard
          title={t('charts.cashflowOverview')}
          subtitle={t('charts.monthlyFlowsAndCumulativeBalance')}
          note={t(
            'charts.leftAxisMonthlyIncomeAndExpensesRightAxisAccumulatedBalanceHeightsAcrossAxesAreNotDirectlyComparable',
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
              {key: 'income', label: t('charts.income'), type: 'bar', role: 'income'},
              {key: 'expenses', label: t('charts.expenses'), type: 'bar', role: 'expense'},
              {key: 'balance', label: t('charts.balance'), type: 'line', role: 'balance', yAxisId: 'right'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            leftAxisLabel={t('charts.monthlyFlow')}
            rightAxisLabel={t('charts.balance')}
            showZeroLine
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12}}>
        <ChartCard title={t('charts.detailedIncome')} subtitle={t('charts.singleSeriesLineWithFullCurrencyTooltip')}>
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: t('charts.balance'), role: 'balance'}]}
            valueFormatter={formatCurrency}
            showGrid={false}
            height={260}
          />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
