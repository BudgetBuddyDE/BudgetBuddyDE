import {AreaChart, ComposedChart, LineChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {
  CATEGORIES,
  averageBalance,
  balanceTrend,
  cashflow,
  categoryStack,
  formatCompactCurrency,
  formatCurrency,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

export const TimeSeriesSection: React.FC = () => {
  return (
    <ShowcaseSection
      title="Time series"
      description="Balances, income and expenses over time - the backbone of financial dashboards."
    >
      <Grid size={{xs: 12, lg: 8}}>
        <ChartCard title="Balance trend" subtitle="Line chart with average reference line">
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: 'Balance', role: 'balance'}]}
            showDots
            showEndLabel
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            referenceLines={[{y: averageBalance, label: 'Average'}]}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 4}}>
        <ChartCard title="Long range with brush" subtitle="Zoom into a range">
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: 'Balance', role: 'balance'}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            brush
            height={300}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Income vs. expenses" subtitle="Synced tooltip (syncId)">
          <LineChart
            data={cashflow}
            xKey="month"
            series={[
              {key: 'income', label: 'Income', role: 'income'},
              {key: 'expenses', label: 'Expenses', role: 'expense'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
            syncId="cashflow"
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Spending by category" subtitle="Stacked area, synced tooltip (syncId)">
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
        <ChartCard title="Cumulative balance" subtitle="Filled area chart">
          <AreaChart
            data={balanceTrend}
            xKey="month"
            gradient
            series={[{key: 'balance', label: 'Balance', role: 'balance'}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard
          title="Cashflow overview"
          subtitle="Monthly flows and cumulative balance"
          note="Left axis: monthly income and expenses. Right axis: accumulated balance; heights across axes are not directly comparable."
        >
          <ComposedChart
            data={balanceTrend.map((row, index) => ({
              ...row,
              income: cashflow[index].income,
              expenses: cashflow[index].expenses,
            }))}
            xKey="month"
            series={[
              {key: 'income', label: 'Income', type: 'bar', role: 'income'},
              {key: 'expenses', label: 'Expenses', type: 'bar', role: 'expense'},
              {key: 'balance', label: 'Balance', type: 'line', role: 'balance', yAxisId: 'right'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            leftAxisLabel="Monthly flow"
            rightAxisLabel="Balance"
            showZeroLine
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12}}>
        <ChartCard title="Detailed income" subtitle="Single series line with full currency tooltip">
          <LineChart
            data={balanceTrend}
            xKey="month"
            series={[{key: 'balance', label: 'Balance', role: 'balance'}]}
            valueFormatter={formatCurrency}
            showGrid={false}
            height={260}
          />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
