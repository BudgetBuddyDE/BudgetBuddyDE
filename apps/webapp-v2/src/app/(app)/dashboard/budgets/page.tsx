'use client';

import {Grid, Skeleton} from '@mantine/core';
import {IconMinus, IconPlus, IconScale} from '@tabler/icons-react';
import {StatsCard} from '@/compositions/Cards/StatsCard';
import {BudgetList, type BudgetListItem} from '@/features/Budgets/BudgetList';

const budgetTemplates: Omit<BudgetListItem, 'id'>[] = [
  {
    name: 'Essen bestellen',
    type: 'i',
    balance: 95.02,
    budget: 100,
    categories: [{id: 'takeaway', name: 'Essen bestellen'}],
  },
  {
    name: 'Nettogehalt',
    type: 'e',
    balance: 1512.04,
    budget: 2600,
    categories: [
      {id: 'insurance', name: 'Versicherungen'},
      {id: 'tax', name: 'Steuern'},
    ],
  },
  {
    name: 'Freizeit',
    type: 'i',
    balance: 19.9,
    budget: 75,
    categories: [
      {id: 'leisure', name: 'Freizeit'},
      {id: 'restaurants', name: 'Auswärts essen'},
    ],
  },
  {
    name: 'Nahrung',
    type: 'i',
    balance: 436.91,
    budget: 400,
    categories: [
      {id: 'groceries', name: 'Lebensmittel'},
      {id: 'takeaway', name: 'Essen bestellen'},
    ],
  },
  {
    name: 'Investitionen & Rücklagen',
    type: 'i',
    balance: 448.84,
    budget: 760,
    categories: [
      {id: 'savings', name: 'Sparen'},
      {id: 'investments', name: 'Investieren'},
    ],
  },
  {
    name: 'Softwareentwicklung',
    type: 'i',
    balance: 1.18,
    budget: 50,
    categories: [
      {id: 'server', name: 'Server'},
      {id: 'software', name: 'Softwareentwicklung'},
      {id: 'saas', name: 'SaaS'},
    ],
  },
  {
    name: 'Haushalt',
    type: 'i',
    balance: 840,
    budget: 1000,
    categories: [
      {id: 'household', name: 'Haushalt'},
      {id: 'supplies', name: 'Haushaltsmittel'},
    ],
  },
  {name: 'Abos', type: 'i', balance: 139.22, budget: 100, categories: [{id: 'subscription', name: 'Abonnement'}]},
  {
    name: 'Mobilität',
    type: 'i',
    balance: -20,
    budget: 150,
    categories: [{id: 'transport', name: 'Öffentlicher Nahverkehr'}],
  },
  {
    name: 'Bruttogehalt',
    type: 'e',
    balance: 1512.04,
    budget: 4100,
    categories: [{id: 'placeholder', name: 'Platzhalter'}],
  },
];

const demoBudgets: BudgetListItem[] = Array.from({length: 30}, (_, index) => {
  const template = budgetTemplates[index % budgetTemplates.length];
  const group = Math.floor(index / budgetTemplates.length);
  return {
    ...template,
    id: `demo-budget-${index + 1}`,
    name: group === 0 ? template.name : `${template.name} ${group + 1}`,
  };
});

const summaries = [
  {title: 'Income', value: '0.00 €', subtitle: 'Upcoming: 0.00 €', icon: <IconPlus />},
  {title: 'Spendings', value: '0.00 €', subtitle: 'Upcoming: 0.00 €', icon: <IconMinus />},
  {title: 'Balance', value: '0.00 €', subtitle: 'Estimated: 0.00 €', icon: <IconScale />},
];

export default function BudgetsPage() {
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

      <Grid.Col span={{base: 12, sm: 7}}>
        <BudgetList data={demoBudgets} />
      </Grid.Col>

      <Grid.Col span={{base: 12, sm: 5}}>{child}</Grid.Col>
    </Grid>
  );
}
