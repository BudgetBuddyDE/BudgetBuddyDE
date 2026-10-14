import {DonutChart, FunnelChart, RadialBarChart, SunburstChart, TreemapChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {
  budgetFunnel,
  budgetUsage,
  formatCurrency,
  formatPercent,
  incomeBySource,
  spendingByCategory,
  spendingSunburst,
  spendingTreemap,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

const totalSpending = spendingByCategory.reduce((accumulator, entry) => accumulator + entry.value, 0);

export const DistributionSection: React.FC = () => {
  return (
    <ShowcaseSection
      title="Distribution & part-to-whole"
      description="How a total is composed - by category, source, hierarchy, budget stage or goal progress."
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Spending by category" subtitle="Donut chart with center label">
          <DonutChart
            data={spendingByCategory}
            showLegend
            valueFormatter={formatCurrency}
            primaryText={formatCurrency(totalSpending)}
            secondaryText="Total spending"
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Income by source" subtitle="Donut chart with legend">
          <DonutChart data={incomeBySource} showLegend valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Budget usage" subtitle="Radial gauge (percent of budget)">
          <RadialBarChart data={budgetUsage} gauge max={100} valueFormatter={formatPercent} height={260} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard
          title="Reimbursement stages"
          subtitle="From submitted to paid claims"
          note="These are descending stages of the same process. Remaining budget is not a conversion stage."
        >
          <FunnelChart data={budgetFunnel} valueFormatter={formatCurrency} height={260} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Spending hierarchy" subtitle="Treemap (category -> subcategory)">
          <TreemapChart data={spendingTreemap} height={320} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Spending sunburst" subtitle="Hierarchical part-to-whole">
          <SunburstChart data={spendingSunburst} height={320} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
