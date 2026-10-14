import {HeatmapChart, RadarChart, ScatterChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {
  HEATMAP_DAYS,
  HEATMAP_WEEKS,
  accountBubble,
  budgetRadar,
  formatCompactCurrency,
  recurringScatter,
  spendingHeatmap,
  transactionsScatter,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

export const RelationshipSection: React.FC = () => {
  return (
    <ShowcaseSection
      title="Relationships & intensity"
      description="Correlations, distributions and density - finding outliers and spending patterns."
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Transactions over time" subtitle="Scatter chart with two series">
          <ScatterChart
            series={[
              {key: 'transactions', label: 'One-off', data: transactionsScatter},
              {key: 'recurring', label: 'Recurring', color: '#DEA500', data: recurringScatter},
            ]}
            xLabel="Transaction"
            yLabel="Amount"
            yFormatter={formatCompactCurrency}
            showLegend
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard
          title="Accounts"
          subtitle="Bubble chart (size = volume)"
          note="Horizontal: activity count. Vertical: account balance. Bubble area: transaction volume."
        >
          <ScatterChart
            series={[{key: 'accounts', label: 'Accounts', data: accountBubble}]}
            xLabel="Activity"
            yLabel="Balance"
            yFormatter={formatCompactCurrency}
            bubble
            zFormatter={formatCompactCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Budget vs. actual" subtitle="Radar chart across categories">
          <RadarChart
            data={budgetRadar}
            metricKey="metric"
            series={[
              {key: 'Goal', label: 'Goal', role: 'target'},
              {key: 'Actual', label: 'Actual', role: 'balance'},
            ]}
            fillArea
            showMarkers
            valueFormatter={formatCompactCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title="Spending intensity" subtitle="Heatmap (week x weekday)">
          <HeatmapChart
            data={spendingHeatmap}
            xLabels={HEATMAP_DAYS}
            yLabels={HEATMAP_WEEKS}
            valueFormatter={formatCompactCurrency}
            height={300}
          />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
