import {Paper, Text, Title} from '@mantine/core';
import {IconMinus, IconPlus, IconScale} from '@tabler/icons-react';
import {StatsCard} from '@/compositions/Cards/StatsCard';
import classes from './DashboardOverview.module.css';

const summaries = [
  {title: 'Income', value: '0.00 €', subtitle: 'Upcoming: 0.00 €', icon: <IconPlus />},
  {title: 'Spendings', value: '0.00 €', subtitle: 'Upcoming: 0.00 €', icon: <IconMinus />},
  {title: 'Balance', value: '0.00 €', subtitle: 'Estimated: 0.00 €', icon: <IconScale />},
];

function PlaceholderCard({title, description, tall = false}: {title: string; description: string; tall?: boolean}) {
  return (
    <Paper component="section" className={`${classes.card} ${tall ? classes.tallCard : classes.detailCard}`}>
      <Title order={2} size="h3">
        {title}
      </Title>
      <Text c="dimmed" mt="xs">
        {description}
      </Text>
    </Paper>
  );
}

export default function DashboardPage() {
  return (
    <div className={classes.overview}>
      <div className={classes.summaryGrid}>
        {summaries.map(({title, value, subtitle, icon}) => (
          <StatsCard key={title} title={title} value={value} subtitle={subtitle} icon={icon} />
        ))}
      </div>
      <div className={classes.contentGrid}>
        <PlaceholderCard
          title="Upcoming recurring payments"
          description="Your upcoming recurring payments will appear here."
          tall
        />
        <div className={classes.middleColumn}>
          <PlaceholderCard title="Budget" description="Your monthly budget overview will appear here." />
          <PlaceholderCard title="Category Expenses" description="Your expenses per category will appear here." />
        </div>
        <PlaceholderCard title="Transactions" description="Your latest transactions will appear here." tall />
      </div>
    </div>
  );
}
