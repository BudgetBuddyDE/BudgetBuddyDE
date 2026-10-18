'use client';

import type {TEstimatedBudget} from '@budgetbuddyde/api/budget';
import {Grid} from '@mui/material';
import {StatsCard, type TStatsCardProps} from '@/components/Analytics/StatsCard';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';

export const DashboardStatsWrapper = ({estimated}: {estimated: TEstimatedBudget}) => {
  const t = useAppTranslations();
  const currencyFormatter = useCurrencyFormatter();
  const currentBalance = estimated.income.received - estimated.expenses.paid;
  const estimatedBalance =
    estimated.income.received + estimated.income.upcoming - (estimated.expenses.paid + estimated.expenses.upcoming);
  const stats: TStatsCardProps[] = [
    {
      icon: 'add',
      label: t('navigation.income'),
      value: currencyFormatter.formatBalance(estimated.income.received),
      valueInformation: t('navigation.upcomingValue0', {
        value0: currencyFormatter.formatBalance(estimated.income.upcoming),
      }),
    },
    {
      icon: 'remove',
      label: t('navigation.spendings'),
      value: currencyFormatter.formatBalance(estimated.expenses.paid),
      valueInformation: t('navigation.upcomingValue0', {
        value0: currencyFormatter.formatBalance(estimated.expenses.upcoming),
      }),
    },
    {
      icon: 'balance',
      label: t('navigation.balance'),
      value: currencyFormatter.formatBalance(currentBalance),
      valueInformation: t('navigation.estimatedValue0', {value0: currencyFormatter.formatBalance(estimatedBalance)}),
    },
  ];

  return (
    <Grid container size={{xs: 12}} spacing={2}>
      {stats.map((props, idx, list) => (
        <Grid
          key={props.label.toString().toLowerCase().replace(' ', '_')}
          size={{xs: idx === list.length - 1 ? 12 : 6, md: 4}}
          sx={{height: 'unset'}}
        >
          <StatsCard isLoading={false} {...props} />
        </Grid>
      ))}
    </Grid>
  );
};
