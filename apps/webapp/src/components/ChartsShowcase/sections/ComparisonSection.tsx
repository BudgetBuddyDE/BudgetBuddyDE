import {BarChart, BulletChart, WaterfallChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {
  CATEGORIES,
  budgetVsActual,
  bulletBudgets,
  cashflow,
  categoryStack,
  formatCompactCurrency,
  formatCurrency,
  spendingByCategory,
  waterfallData,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

export const ComparisonSection: React.FC = () => {
  return (
    <ShowcaseSection
      title="Comparison"
      description="Bars, budget targets and cash flow bridges for comparing values across categories and time."
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Budget vs. actual" subtitle="Grouped bar chart">
          <BarChart
            data={budgetVsActual}
            xKey="category"
            series={[
              {key: 'budget', label: 'Budget', role: 'target'},
              {key: 'actual', label: 'Actual', role: 'balance'},
            ]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showLegend
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Spending by category" subtitle="Stacked bar chart">
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
        <ChartCard title="Top categories" subtitle="Horizontal bar chart">
          <BarChart
            data={spendingByCategory}
            xKey="label"
            series={[{key: 'value', label: 'Spent'}]}
            horizontal
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            height={280}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Monthly net" subtitle="Negative values with zero baseline">
          <BarChart
            data={cashflow}
            xKey="month"
            series={[{key: 'net', label: 'Net'}]}
            axisValueFormatter={formatCompactCurrency}
            tooltipValueFormatter={formatCurrency}
            showZeroLine
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Cash flow bridge" subtitle="Waterfall chart">
          <WaterfallChart data={waterfallData} valueFormatter={formatCompactCurrency} height={320} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Budget utilization" subtitle="Bullet chart: actual vs. target within range">
          <BulletChart data={bulletBudgets} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
