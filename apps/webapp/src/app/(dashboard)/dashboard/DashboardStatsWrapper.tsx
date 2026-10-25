import type {TEstimatedBudget} from '@budgetbuddyde/api/budget';
import {Grid} from '@mui/material';
import {useTranslations} from 'next-intl';
import {StatsCard, type TStatsCardProps} from '@/components/Analytics/StatsCard';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';

export const DashboardStatsWrapper = ({estimated}: {estimated: TEstimatedBudget}) => {
  const t = useTranslations('DashboardStats');
  const currency = useCurrencyPreference();
  const currentBalance = estimated.income.received - estimated.expenses.paid;
  const estimatedBalance =
    estimated.income.received + estimated.income.upcoming - (estimated.expenses.paid + estimated.expenses.upcoming);
  const stats: TStatsCardProps[] = [
    {
      icon: 'add',
      label: t('income'),
      value: Formatter.currency.formatBalance(estimated.income.received, currency),
      valueInformation: `${t('upcoming')}: ${Formatter.currency.formatBalance(estimated.income.upcoming, currency)}`,
    },
    {
      icon: 'remove',
      label: t('spendings'),
      value: Formatter.currency.formatBalance(estimated.expenses.paid, currency),
      valueInformation: `${t('upcoming')}: ${Formatter.currency.formatBalance(estimated.expenses.upcoming, currency)}`,
    },
    {
      icon: 'balance',
      label: t('balance'),
      value: Formatter.currency.formatBalance(currentBalance, currency),
      valueInformation: `${t('estimated')}: ${Formatter.currency.formatBalance(estimatedBalance, currency)}`,
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
