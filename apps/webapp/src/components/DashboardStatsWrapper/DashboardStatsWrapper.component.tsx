import {AddRounded, BalanceRounded, RemoveRounded} from '@mui/icons-material';
import {Grid2 as Grid} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';
import {useSubscriptionStore} from '@/features/Subscription';
import {useTransactionStore, useTransactions} from '@/features/Transaction';
import {logger} from '@/logger';
import {TMonthlyKPIResponse} from '@/newTypes';
import {Formatter} from '@/services/Formatter';

import {StatsCard, type TStatsCardProps} from '../StatsCard';

export type TDashboardStatsWrapperProps = unknown;

export const DashboardStatsWrapper: React.FC<TDashboardStatsWrapperProps> = () => {
  const {getStats} = useTransactions();
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<TMonthlyKPIResponse | null>(null);

  const fetchData = async () => {
    if (!isLoading) setIsLoading(true);
    const [monthlyKPIs, err] = await getStats();
    setIsLoading(false);
    if (err) {
      logger.error("Something wen't wrong", err);
      return;
    }
    setData(monthlyKPIs);
  };

  const stats: TStatsCardProps[] = React.useMemo(() => {
    if (!data) return [];
    return [
      {
        isLoading: isLoading,
        icon: <AddRounded />,
        label: 'Income',
        value: Formatter.formatBalance(data.receivedIncome),
        valueInformation: `Upcoming: ${Formatter.formatBalance(data.upcomingIncome)}`,
      },
      {
        isLoading: isLoading,
        icon: <RemoveRounded />,
        label: 'Spendings',
        value: Formatter.formatBalance(data.paidExpenses),
        valueInformation: `Upcoming: ${Formatter.formatBalance(data.upcomingExpenses)}`,
      },
      {
        icon: <BalanceRounded />,
        label: 'Balance',
        value: Formatter.formatBalance(data.currentBalance),
        valueInformation: `Exstimated: ${Formatter.formatBalance(data.estimatedBalance)}`,
      },
    ];
  }, [isLoading, data]);

  React.useEffect(() => {
    fetchData();

    useTransactionStore.subscribe((curr, prev) => {
      if ((prev.data ?? []).length !== (curr.data ?? []).length) fetchData();
    });

    useSubscriptionStore.subscribe((curr, prev) => {
      if ((prev.data ?? []).length !== (curr.data ?? []).length) fetchData();
    });
  }, []);

  return (
    <Grid container size={{xs: 12}} spacing={AppConfig.baseSpacing}>
      {stats.map((props, idx, list) => (
        <Grid
          key={props.label.toString().toLowerCase().replace(' ', '_')}
          size={{xs: idx == list.length - 1 ? 12 : 6, md: 4}}
          sx={{height: 'unset'}}>
          <StatsCard isLoading={isLoading} {...props} />
        </Grid>
      ))}
    </Grid>
  );
};
