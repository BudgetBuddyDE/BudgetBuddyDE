import { MetalQuoteList } from '@/components/Metal/MetalQuoteList';
import { PortfolioDiversityChart } from '@/components/Stocks/PortfolioDiversityChart';
import { StockPositionTable } from '@/components/Stocks/StockPositionTable';
import { StockStats } from '@/components/Stocks/StockStats';
import { Grid } from '@mui/material';
import React from 'react';

export default function StocksDashboard() {
  return (
    <React.Fragment>
      <StockStats />

      <Grid container size={{ xs: 12, md: 8.5 }} sx={{ height: 'fit-content' }} spacing={2}>
        <Grid size={{ xs: 12 }} order={{ xs: 4 }}>
          <StockPositionTable withRedirect />
        </Grid>
      </Grid>

      <Grid container size={{ xs: 12, md: 3.5 }} spacing={2}>
        <Grid size={{ xs: 12 }}>
          <PortfolioDiversityChart />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <MetalQuoteList />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
