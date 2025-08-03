import { StatsCard, type TStatsCardProps } from '@/components/Analytics/StatsCard';
import { TransactionService } from '@/services/Transaction.service';
import { Formatter } from '@/utils/Formatter';
import { AddRounded, BalanceRounded, RemoveRounded } from '@mui/icons-material';
import { Grid } from '@mui/material';
import { headers } from 'next/headers';

export const DashboardStatsWrapper = async () => {
  const [monthlyKPIs, error] = await TransactionService.getMonthlyKPIs({
    headers: await headers(),
  });
  if (error) throw error;

  const stats: TStatsCardProps[] = [
    {
      icon: <AddRounded />,
      label: 'Income',
      value: Formatter.currency.formatBalance(monthlyKPIs.receivedIncome),
      valueInformation: `Upcoming: ${Formatter.currency.formatBalance(monthlyKPIs.upcomingIncome)}`,
    },
    {
      icon: <RemoveRounded />,
      label: 'Spendings',
      value: Formatter.currency.formatBalance(monthlyKPIs.paidExpenses),
      valueInformation: `Upcoming: ${Formatter.currency.formatBalance(
        monthlyKPIs.upcomingExpenses
      )}`,
    },
    {
      icon: <BalanceRounded />,
      label: 'Balance',
      value: Formatter.currency.formatBalance(monthlyKPIs.currentBalance),
      valueInformation: `Estimated: ${Formatter.currency.formatBalance(
        monthlyKPIs.estimatedBalance
      )}`,
    },
  ];

  return (
    <Grid container size={{ xs: 12 }} spacing={2}>
      {stats.map((props, idx, list) => (
        <Grid
          key={props.label.toString().toLowerCase().replace(' ', '_')}
          size={{ xs: idx == list.length - 1 ? 12 : 6, md: 4 }}
          sx={{ height: 'unset' }}
        >
          <StatsCard isLoading={false} {...props} />
        </Grid>
      ))}
    </Grid>
  );
};
