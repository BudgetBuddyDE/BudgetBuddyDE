'use client';

import {HeatmapChart, RadarChart, ScatterChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {
  HEATMAP_DAYS,
  HEATMAP_WEEKS,
  accountBubble,
  budgetRadar,
  recurringScatter,
  spendingHeatmap,
  transactionsScatter,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

export const RelationshipSection: React.FC = () => {
  const t = useAppTranslations();
  const {shortenBalance: formatCompactCurrency} = useCurrencyFormatter();
  return (
    <ShowcaseSection
      title={t('Relationships & intensity')}
      description={t('Correlations, distributions and density - finding outliers and spending patterns.')}
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Transactions over time')} subtitle={t('Scatter chart with two series')}>
          <ScatterChart
            series={[
              {key: 'transactions', label: t('One-off'), data: transactionsScatter},
              {key: 'recurring', label: t('Recurring'), color: '#DEA500', data: recurringScatter},
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
          title={t('Accounts')}
          subtitle={t('Bubble chart (size = volume)')}
          note={t('Horizontal: activity count. Vertical: account balance. Bubble area: transaction volume.')}
        >
          <ScatterChart
            series={[{key: 'accounts', label: t('Accounts'), data: accountBubble}]}
            xLabel="Activity"
            yLabel="Balance"
            yFormatter={formatCompactCurrency}
            bubble
            zFormatter={formatCompactCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Budget vs. actual')} subtitle={t('Radar chart across categories')}>
          <RadarChart
            data={budgetRadar}
            metricKey="metric"
            series={[
              {key: 'Goal', label: t('Goal'), role: 'target'},
              {key: 'Actual', label: t('Actual'), role: 'balance'},
            ]}
            fillArea
            showMarkers
            valueFormatter={formatCompactCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Spending intensity')} subtitle={t('Heatmap (week x weekday)')}>
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
