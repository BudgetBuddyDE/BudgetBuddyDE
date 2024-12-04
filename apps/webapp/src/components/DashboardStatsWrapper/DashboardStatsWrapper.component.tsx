import {AddRounded, BalanceRounded, RemoveRounded} from '@mui/icons-material';
import {Grid2 as Grid} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';
import {useSubscriptionStore} from '@/features/Subscription';
import {useTransactionStore, useTransactions} from '@/features/Transaction';
import {type TTransactionStats} from '@/features/Transaction/Transaction.types';
import {Formatter} from '@/services/Formatter';

import {StatsCard, type TStatsCardProps} from '../StatsCard';

export type TDashboardStatsWrapperProps = unknown;

export const DashboardStatsWrapper: React.FC<TDashboardStatsWrapperProps> = () => {
  const {getStats} = useTransactions();
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<TTransactionStats | null>(null);

  const fetchData = async () => {
    if (!isLoading) setIsLoading(true);
    const now = new Date();
    const [budget, err] = await getStats(
      new Date(now.getFullYear(), now.getMonth(), 1),
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    );
    setIsLoading(false);
    if (err) {
      console.error(err);
      return;
    }
    setData(budget);
  };

  const stats: TStatsCardProps[] = React.useMemo(() => {
    if (!data) return [];
    return [
      {
        isLoading: isLoading,
        icon: <AddRounded />,
        label: 'Income',
        value: Formatter.formatBalance(data.income.received),
        valueInformation: `Upcoming: ${Formatter.formatBalance(data.income.upcoming)}`,
      },
      {
        isLoading: isLoading,
        icon: <RemoveRounded />,
        label: 'Spendings',
        value: Formatter.formatBalance(data.expenses.received),
        valueInformation: `Upcoming: ${Formatter.formatBalance(data.expenses.upcoming)}`,
      },
      {
        icon: <BalanceRounded />,
        label: 'Balance',
        value: Formatter.formatBalance(data.balance.current),
        valueInformation: `Exstimated: ${Formatter.formatBalance(data.balance.estimated)}`,
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
