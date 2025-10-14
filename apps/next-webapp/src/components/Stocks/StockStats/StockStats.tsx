import { headers } from 'next/headers';
import { Grid } from '@mui/material';
import {
  AccountBalanceRounded,
  AddRounded,
  RemoveRounded,
  PaymentsRounded,
} from '@mui/icons-material';
import { Formatter } from '@/utils/Formatter';
import { StatsCard } from '@/components/Analytics/StatsCard';
import { AssetService } from '@/services/Stock';

export const StockStats = async () => {
  const [KPIs, error] = await AssetService.positions.getKPIs({ headers: await headers() });
  if (error) throw error;
  const {
    absoluteCapitalGains,
    boundCapitalOnLosingPositions,
    freeCapitalOnProfitablePositions,
    totalPositionValue,
    unrealisedLoss,
    unrealisedProfit,
    upcomingDividends,
  } = KPIs;
  return (
    <Grid container size={{ xs: 12 }} spacing={2}>
      {[
        {
          label: 'Depot',
          value: Formatter.currency.formatBalance(totalPositionValue),
          icon: <AccountBalanceRounded />,
          isLoading: false,
          valueInformation: `Capital gain: ${Formatter.currency.formatBalance(
            absoluteCapitalGains
          )}`,
        },
        {
          label: 'Unrealised profits',
          value: Formatter.currency.formatBalance(unrealisedProfit),
          icon: <AddRounded />,
          isLoading: false,
          valueInformation: `Free capital: ${Formatter.currency.formatBalance(
            freeCapitalOnProfitablePositions
          )}`,
        },
        {
          label: 'Unrealised losses',
          value: Formatter.currency.formatBalance(unrealisedLoss),
          icon: <RemoveRounded />,
          isLoading: false,
          valueInformation: `Bound capital: ${Formatter.currency.formatBalance(
            boundCapitalOnLosingPositions
          )}`,
        },
        {
          label: 'Upcoming dividends',
          value: Formatter.currency.formatBalance(upcomingDividends),
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
  );
};
