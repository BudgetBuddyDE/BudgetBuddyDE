'use client';

import {DonutChart, FunnelChart, RadialBarChart, SunburstChart, TreemapChart} from '@budgetbuddyde/charts';
import {Grid} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';
import {
  budgetFunnel,
  budgetUsage,
  formatPercent,
  incomeBySource,
  spendingByCategory,
  spendingSunburst,
  spendingTreemap,
} from '../data/fixtures';
import {ChartCard, ShowcaseSection} from '../ShowcaseLayout';

const totalSpending = spendingByCategory.reduce((accumulator, entry) => accumulator + entry.value, 0);

export const DistributionSection: React.FC = () => {
  const t = useAppTranslations();
  const {formatBalance: formatCurrency} = useCurrencyFormatter();
  return (
    <ShowcaseSection
      title={t('charts.distributionPartToWhole')}
      description={t('charts.howATotalIsComposedByCategorySourceHierarchyBudgetStageOrGoalProgress')}
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.spendingByCategory')} subtitle={t('charts.donutChartWithCenterLabel')}>
          <DonutChart
            data={spendingByCategory}
            showLegend
            valueFormatter={formatCurrency}
            primaryText={formatCurrency(totalSpending)}
            secondaryText={t('charts.totalSpending')}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.incomeBySource')} subtitle={t('charts.donutChartWithLegend')}>
          <DonutChart data={incomeBySource} showLegend valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.budgetUsage')} subtitle={t('charts.radialGaugePercentOfBudget')}>
          <RadialBarChart data={budgetUsage} gauge max={100} valueFormatter={formatPercent} height={260} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard
          title={t('charts.reimbursementStages')}
          subtitle={t('charts.fromSubmittedToPaidClaims')}
          note={t('charts.theseAreDescendingStagesOfTheSameProcessRemainingBudgetIsNotAConversionStage')}
        >
          <FunnelChart data={budgetFunnel} valueFormatter={formatCurrency} height={260} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.spendingHierarchy')} subtitle={t('charts.treemapCategorySubcategory')}>
          <TreemapChart data={spendingTreemap} height={320} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('charts.spendingSunburst')} subtitle={t('charts.hierarchicalPartToWhole')}>
          <SunburstChart data={spendingSunburst} height={320} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
