import type {TEstimatedBudget} from '@budgetbuddyde/api/budget';
import {Grid} from '@mui/material';
import {cookies, headers} from 'next/headers';
import {getFormatter, getTranslations} from 'next-intl/server';
import {apiClient} from '@/apiClient';
import {StatsCard, type TStatsCardProps} from '@/components/Analytics/StatsCard';

export const DashboardStatsWrapper = async ({estimated}: {estimated: TEstimatedBudget}) => {
  const [t, formatter, requestHeaders, cookieStore] = await Promise.all([
    getTranslations('DashboardStats'),
    getFormatter(),
    headers(),
    cookies(),
  ]);
  const [preference, preferenceError] = await apiClient.backend.preference.get({headers: requestHeaders, cache: 'no-store'});
  if (preferenceError) throw preferenceError;
  const currency = cookieStore.get('budgetbuddy-currency')?.value === 'USD' || preference.data.currency === 'USD' ? 'USD' : 'EUR';
  const formatCurrency = (value: number) => formatter.number(value, {style: 'currency', currency});
  const currentBalance = estimated.income.received - estimated.expenses.paid;
  const estimatedBalance =
    estimated.income.received + estimated.income.upcoming - (estimated.expenses.paid + estimated.expenses.upcoming);
  const stats: TStatsCardProps[] = [
    {
      icon: 'add',
      label: t('income'),
      value: formatCurrency(estimated.income.received),
      valueInformation: `${t('upcoming')}: ${formatCurrency(estimated.income.upcoming)}`,
    },
    {
      icon: 'remove',
      label: t('spendings'),
      value: formatCurrency(estimated.expenses.paid),
      valueInformation: `${t('upcoming')}: ${formatCurrency(estimated.expenses.upcoming)}`,
    },
    {
      icon: 'balance',
      label: t('balance'),
      value: formatCurrency(currentBalance),
      valueInformation: `${t('estimated')}: ${formatCurrency(estimatedBalance)}`,
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
