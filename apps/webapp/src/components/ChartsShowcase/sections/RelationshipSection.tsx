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
      title={t('charts.relationshipsIntensity')}
      description={t('charts.correlationsDistributionsAndDensityFindingOutliersAndSpendingPatterns')}
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.transactionsOverTime')} subtitle={t('charts.scatterChartWithTwoSeries')}>
          <ScatterChart
            series={[
              {key: 'transactions', label: t('charts.oneOff'), data: transactionsScatter},
              {key: 'recurring', label: t('charts.recurring'), color: '#DEA500', data: recurringScatter},
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
          title={t('charts.accounts')}
          subtitle={t('charts.bubbleChartSizeVolume')}
          note={t('charts.horizontalActivityCountVerticalAccountBalanceBubbleAreaTransactionVolume')}
        >
          <ScatterChart
            series={[{key: 'accounts', label: t('charts.accounts'), data: accountBubble}]}
            xLabel="Activity"
            yLabel="Balance"
            yFormatter={formatCompactCurrency}
            bubble
            zFormatter={formatCompactCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.budgetVsActual')} subtitle={t('charts.radarChartAcrossCategories')}>
          <RadarChart
            data={budgetRadar}
            metricKey="metric"
            series={[
              {key: 'Goal', label: t('charts.goal'), role: 'target'},
              {key: 'Actual', label: t('charts.actual'), role: 'balance'},
            ]}
            fillArea
            showMarkers
            valueFormatter={formatCompactCurrency}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.spendingIntensity')} subtitle={t('charts.heatmapWeekXWeekday')}>
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
