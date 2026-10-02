import {Paper, Text, Title} from '@mantine/core';
import classes from './DashboardOverview.module.css';

const summaries = [
  {title: 'Income', description: 'Your income overview will appear here.'},
  {title: 'Spendings', description: 'Your spending overview will appear here.'},
  {title: 'Balance', description: 'Your balance overview will appear here.'},
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
        {summaries.map(({title, description}) => (
          <Paper key={title} component="section" className={`${classes.card} ${classes.summaryCard}`}>
            <Title order={2} size="h4">
              {title}
            </Title>
            <Text c="dimmed" mt="md">
              {description}
            </Text>
          </Paper>
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
