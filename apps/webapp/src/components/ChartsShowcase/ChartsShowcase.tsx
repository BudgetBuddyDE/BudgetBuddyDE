'use client';

import {Box, Container, Stack, Typography, Button, useColorScheme} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {AdvancedSection} from './sections/AdvancedSection';
import {ComparisonSection} from './sections/ComparisonSection';
import {DistributionSection} from './sections/DistributionSection';
import {RelationshipSection} from './sections/RelationshipSection';
import {TimeSeriesSection} from './sections/TimeSeriesSection';

/**
 * Reference gallery for the `@budgetbuddyde/charts` package.
 *
 * Renders every finance-oriented chart type with deterministic demo data so the
 * wrappers can be reviewed in both light and dark mode.
 */
export const ChartsShowcase: React.FC = () => {
  const t = useAppTranslations();
  const {mode, setMode} = useColorScheme();
  return (
    <Container component="main" maxWidth="xl" sx={{py: {xs: 3, md: 5}}}>
      <Stack sx={{mb: 4}}>
        <Typography component="h1" variant="h4" sx={{fontWeight: 700}}>
          {t('charts.financialCharts')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('charts.exploreBalancesBudgetsAndMoneyFlowsAllExamplesUseFictionalData')}
        </Typography>
        <Box
          component="nav"
          aria-label={t('charts.chartSections')}
          sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2}}
        >
          {(
            [
              {key: 'charts.timeSeries', label: t('charts.timeSeries')},
              {key: 'charts.comparison', label: t('charts.comparison')},
              {key: 'charts.distributionAndPartToWhole', label: t('charts.distributionPartToWhole')},
              {key: 'charts.relationshipsIntensity', label: t('charts.relationshipsIntensity')},
              {key: 'charts.flowsInvestmentsKPIs', label: t('charts.flowsInvestmentsKPIs')},
            ] as const
          ).map(({key, label}) => (
            <Button key={key} href={`#${label.toLowerCase().replace(/[^a-z]+/g, '-')}`} size="small">
              {label}
            </Button>
          ))}
          <Button size="small" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
            {t('charts.switchAppearance')}
          </Button>
        </Box>
      </Stack>
      <TimeSeriesSection />
      <ComparisonSection />
      <DistributionSection />
      <RelationshipSection />
      <AdvancedSection />
    </Container>
  );
};
