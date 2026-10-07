'use client';

import {Grid, Skeleton, Stack} from '@mantine/core';
import {IconMinus, IconPlus, IconScale} from '@tabler/icons-react';
import {BudgetOverviewCard} from '@/compositions/Cards/BudgetOverviewCard';
import {StatsCard} from '@/compositions/Cards/StatsCard';
import {RecurringPaymentList} from '@/features/RecurringPayments/RecurringPaymentList';
import {TransactionList} from '@/features/Transactions/TransactionList';

const transactions = [
  {
    id: 'transaction-openai',
    receiver: 'OpenAI',
    processedAt: new Date(2026, 9, 6),
    transferAmount: -23,
    category: {id: 'subscription', name: 'Abonnement'},
    paymentMethod: {id: 'n26-debit', name: 'Debitcard (N26, Hauptkonto)'},
  },
  {
    id: 'transaction-uber-eats',
    receiver: 'Uber Eats',
    processedAt: new Date(2026, 9, 4),
    transferAmount: -18.06,
    category: {id: 'food-order', name: 'Essen bestellen'},
    paymentMethod: {id: 'n26-debit', name: 'Debitcard (N26, Hauptkonto)'},
  },
  {
    id: 'transaction-n26',
    receiver: 'N26',
    processedAt: new Date(2026, 9, 3),
    transferAmount: -235.34,
    category: {id: 'investing', name: 'Investieren'},
    paymentMethod: {id: 'n26-debit', name: 'Debitcard (N26, Hauptkonto)'},
  },
  {
    id: 'transaction-aws',
    receiver: 'AWS',
    processedAt: new Date(2026, 9, 2),
    transferAmount: -1.18,
    category: {id: 'server', name: 'Server'},
    paymentMethod: {id: 'n26-debit', name: 'Debitcard (N26, Hauptkonto)'},
  },
  {
    id: 'transaction-deutsche-bahn',
    receiver: 'Deutsche Bahn',
    processedAt: new Date(2026, 9, 2),
    transferAmount: -25.99,
    category: {id: 'transport', name: 'Transport'},
    paymentMethod: {id: 'n26-debit', name: 'Debitcard (N26, Hauptkonto)'},
  },
  {
    id: 'transaction-1password',
    receiver: '1Password.com',
    processedAt: new Date(2026, 9, 2),
    transferAmount: -8.32,
    category: {id: 'subscription', name: 'Abonnement'},
    paymentMethod: {id: 'mastercard', name: 'Mastercard Hauptkonto'},
  },
];

const recurringPayments = [
  {
    id: 'recurring-spotify',
    receiver: 'Spotify',
    nextExecution: new Date(2026, 9, 10),
    transferAmount: -10.99,
    category: {id: 'subscription', name: 'Abonnement'},
    paymentMethod: {id: 'mastercard', name: 'Mastercard Hauptkonto'},
  },
  {
    id: 'recurring-energy',
    receiver: 'Stadtwerke',
    nextExecution: new Date(2026, 9, 15),
    transferAmount: -86.42,
    category: {id: 'energy', name: 'Energie'},
    paymentMethod: {id: 'n26-debit', name: 'Debitcard (N26, Hauptkonto)'},
  },
  {
    id: 'recurring-rent',
    receiver: 'Miete',
    nextExecution: new Date(2026, 10, 1),
    transferAmount: -950,
    category: {id: 'housing', name: 'Wohnen'},
    paymentMethod: {id: 'mastercard', name: 'Mastercard Hauptkonto'},
  },
];

const summaries = [
  {title: 'Income', value: '0.00 €', subtitle: 'Upcoming: 0.00 €', icon: <IconPlus />},
  {title: 'Spendings', value: '0.00 €', subtitle: 'Upcoming: 0.00 €', icon: <IconMinus />},
  {title: 'Balance', value: '0.00 €', subtitle: 'Estimated: 0.00 €', icon: <IconScale />},
];

export default function DashboardPage() {
  const child = <Skeleton height={140} radius="md" animate={false} />;

  return (
    <Grid>
      <Grid.Col span={{base: 12, xs: 12}}>
        <Grid>
          {summaries.map(({title, value, subtitle, icon}) => (
            <Grid.Col span={{base: 12, xs: 4}} key={title}>
              <StatsCard title={title} value={value} subtitle={subtitle} icon={icon} />
            </Grid.Col>
          ))}
        </Grid>
      </Grid.Col>

      <Grid.Col span={{base: 12, xs: 4}}>
        <RecurringPaymentList data={recurringPayments} />
      </Grid.Col>

      <Grid.Col span={{base: 12, xs: 4}}>
        <Stack>
          <BudgetOverviewCard totalBudget={4129.93} spent={1244.38} futureExpenses={1678.44} />
          {child}
        </Stack>
      </Grid.Col>

      <Grid.Col span={{base: 12, xs: 4}}>
        <TransactionList data={transactions} />
      </Grid.Col>
    </Grid>
  );
}
