import { StatsCard } from '@/components/Analytics/StatsCard';
import { MetalQuoteList } from '@/components/Metal/MetalQuoteList';
import { DividendTable } from '@/components/Stocks/Dividend';
import { PortfolioDiversityChart } from '@/components/Stocks/PortfolioDiversityChart';
import { StockPositionTableWrapper } from '@/components/Stocks/StockPositionTable';
import { StockWatchlist } from '@/components/Stocks/StockWatchlist';
import { Formatter } from '@/utils/Formatter';
import {
  AccountBalanceRounded,
  AddRounded,
  PaymentsRounded,
  RemoveRounded,
} from '@mui/icons-material';
import { Grid } from '@mui/material';
import React from 'react';

export default function StocksDashboard() {
  return (
    <React.Fragment>
      <Grid container size={{ xs: 12 }} spacing={2}>
        {[
          {
            label: 'Depot',
            value: Formatter.currency.formatBalance(0),
            icon: <AccountBalanceRounded />,
            isLoading: false,
            valueInformation: `Capital gain: ${Formatter.currency.formatBalance(0)}`,
          },
          {
            label: 'Unrealised profits',
            value: Formatter.currency.formatBalance(0),
            icon: <AddRounded />,
            isLoading: false,
            valueInformation: `Free capital: ${Formatter.currency.formatBalance(0)}`,
          },
          {
            label: 'Unrealised losses',
            value: Formatter.currency.formatBalance(0),
            icon: <RemoveRounded />,
            isLoading: false,
            valueInformation: `Bound capital: ${Formatter.currency.formatBalance(0)}`,
          },
          {
            label: 'Upcoming dividends',
            value: Formatter.currency.formatBalance(0),
            icon: <PaymentsRounded />,
            isLoading: false,
            valueInformation: 'Expected upcoming dividend payments',
          },
        ].map(({ value, valueInformation, icon, isLoading, label }) => (
          <Grid key={label.toLowerCase().replaceAll(' ', '_')} size={{ xs: 6, md: 3 }}>
            <StatsCard
              label={label}
              value={value}
              icon={icon}
              isLoading={isLoading}
              valueInformation={valueInformation}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container size={{ xs: 12, md: 8 }} sx={{ height: 'fit-content' }} spacing={2}>
        <Grid size={{ xs: 12 }} order={{ xs: 4 }}>
          <StockPositionTableWrapper />
        </Grid>

        <Grid size={{ xs: 12 }} order={{ xs: 5 }}>
          <DividendTable dividends={[]} />
        </Grid>
      </Grid>

      <Grid container size={{ xs: 12, md: 4 }} spacing={2}>
        <Grid size={{ xs: 12 }}>
          <PortfolioDiversityChart positions={[]} />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <MetalQuoteList />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <StockWatchlist title="Watchlist" subtitle="Watched assets" data={[]} />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
