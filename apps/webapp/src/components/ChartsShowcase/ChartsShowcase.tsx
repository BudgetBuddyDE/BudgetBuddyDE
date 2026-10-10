'use client';

import {Box, Container, Stack, Typography, Button, useColorScheme} from '@mui/material';
import React from 'react';
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
  const {mode, setMode} = useColorScheme();
  return (
    <Container component="main" maxWidth="xl" sx={{py: {xs: 3, md: 5}}}>
      <Stack sx={{mb: 4}}>
        <Typography component="h1" variant="h4" sx={{fontWeight: 700}}>
          Financial charts
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore balances, budgets and money flows. All examples use fictional data.
        </Typography>
        <Box component="nav" aria-label="Chart sections" sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2}}>
          {[
            'Time series',
            'Comparison',
            'Distribution & part-to-whole',
            'Relationships & intensity',
            'Flows, investments & KPIs',
          ].map(title => (
            <Button key={title} href={`#${title.toLowerCase().replace(/[^a-z]+/g, '-')}`} size="small">
              {title}
            </Button>
          ))}
          <Button size="small" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
            Switch appearance
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
