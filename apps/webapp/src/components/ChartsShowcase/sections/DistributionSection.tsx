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
      title={t('Distribution & part-to-whole')}
      description={t('How a total is composed - by category, source, hierarchy, budget stage or goal progress.')}
    >
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Spending by category')} subtitle={t('Donut chart with center label')}>
          <DonutChart
            data={spendingByCategory}
            showLegend
            valueFormatter={formatCurrency}
            primaryText={formatCurrency(totalSpending)}
            secondaryText={t('Total spending')}
          />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Income by source')} subtitle={t('Donut chart with legend')}>
          <DonutChart data={incomeBySource} showLegend valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Budget usage')} subtitle={t('Radial gauge (percent of budget)')}>
          <RadialBarChart data={budgetUsage} gauge max={100} valueFormatter={formatPercent} height={260} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard
          title={t('Reimbursement stages')}
          subtitle={t('From submitted to paid claims')}
          note={t('These are descending stages of the same process. Remaining budget is not a conversion stage.')}
        >
          <FunnelChart data={budgetFunnel} valueFormatter={formatCurrency} height={260} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Spending hierarchy')} subtitle={t('Treemap (category -> subcategory)')}>
          <TreemapChart data={spendingTreemap} height={320} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
      <Grid size={{xs: 12, lg: 6}}>
        <ChartCard title={t('Spending sunburst')} subtitle={t('Hierarchical part-to-whole')}>
          <SunburstChart data={spendingSunburst} height={320} valueFormatter={formatCurrency} />
        </ChartCard>
      </Grid>
    </ShowcaseSection>
  );
};
