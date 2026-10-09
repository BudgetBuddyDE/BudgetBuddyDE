'use client';

import {Badge, Button, Group, Progress, SimpleGrid, Stack, Table, Text, Title, useMantineTheme} from '@mantine/core';
import {useMediaQuery} from '@mantine/hooks';
import {Card} from '@/compositions/Cards/Card';

const budgets = [
  {title: 'Groceries', description: 'Your monthly grocery budget', spent: 320, limit: 500},
  {title: 'Leisure', description: 'Dining out and entertainment', spent: 180, limit: 200},
  {title: 'Transport', description: 'Your monthly travel costs', spent: 60, limit: 150},
] as const;

const [groceries, leisure, transport] = budgets;
const totals = budgets.reduce(
  (total, budget) => ({spent: total.spent + budget.spent, limit: total.limit + budget.limit}),
  {spent: 0, limit: 0},
);
const travelSavings = {saved: 1200, target: 2000};
const moneyFormatter = new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function BudgetProgress({
  value,
  total,
  label,
  color = 'blue',
}: {
  value: number;
  total: number;
  label: string;
  color?: string;
}) {
  const progress = (value / total) * 100;

  return (
    <Stack gap="xs">
      <Group justify="space-between" gap="xs">
        <Text fw={600}>
          {formatMoney(value)} / {formatMoney(total)}
        </Text>
        <Text size="sm" c="dimmed">
          {Math.round(progress)}%
        </Text>
      </Group>
      <Progress value={progress} color={color} size="lg" radius="xl" aria-label={label} />
    </Stack>
  );
}

export default function CardDemoPage() {
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);
  const cards = [
    <Card key="groceries" component="section" aria-labelledby="groceries-title" padding="md" radius="md" shadow="sm">
      <Card.Header withBorder>
        <div>
          <Card.Title id="groceries-title">{groceries.title}</Card.Title>
          <Card.Subtitle>{groceries.description}</Card.Subtitle>
        </div>
        <Card.HeaderActions>
          <Button size="xs" variant="default" disabled>
            Edit
          </Button>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        <BudgetProgress value={groceries.spent} total={groceries.limit} label="Groceries budget used" />
      </Card.Body>
      <Card.Footer withBorder>
        <Text size="sm" c="dimmed">
          {formatMoney(groceries.limit - groceries.spent)} remaining this month
        </Text>
      </Card.Footer>
    </Card>,

    <Card key="leisure" component="section" aria-labelledby="leisure-title" padding="md" radius="md" withBorder>
      <Card.Header>
        <div>
          <Card.Title id="leisure-title">{leisure.title}</Card.Title>
          <Card.Subtitle>{leisure.description}</Card.Subtitle>
        </div>
        <Badge color="orange" variant="light">
          Almost reached
        </Badge>
      </Card.Header>
      <Card.Body>
        <BudgetProgress value={leisure.spent} total={leisure.limit} label="Leisure budget used" color="orange" />
      </Card.Body>
    </Card>,

    <Card key="transport" component="section" aria-labelledby="transport-title" padding="md" radius="md" withBorder>
      <Card.Body>
        <Stack gap="md">
          <div>
            <Card.Title id="transport-title">{transport.title}</Card.Title>
            <Card.Subtitle>{transport.description}</Card.Subtitle>
          </div>
          <BudgetProgress value={transport.spent} total={transport.limit} label="Transport budget used" />
        </Stack>
      </Card.Body>
    </Card>,

    <Card key="breakdown" component="section" aria-labelledby="breakdown-title" padding="md" radius="md" withBorder>
      <Card.Header withBorder>
        <div>
          <Card.Title id="breakdown-title">Budget breakdown</Card.Title>
          <Card.Subtitle>Your monthly spending at a glance</Card.Subtitle>
        </div>
      </Card.Header>
      <Card.Body inheritPadding={false} py={0}>
        <Table.ScrollContainer minWidth={320} type="native">
          <Table aria-label="Monthly budget breakdown" horizontalSpacing="md" verticalSpacing="sm" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th scope="col">Budget</Table.Th>
                <Table.Th scope="col" ta="right">
                  Spent
                </Table.Th>
                <Table.Th scope="col" ta="right">
                  Limit
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {budgets.map(budget => (
                <Table.Tr key={budget.title}>
                  <Table.Th scope="row" fw={400}>
                    {budget.title}
                  </Table.Th>
                  <Table.Td ta="right">{formatMoney(budget.spent)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(budget.limit)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card.Body>
      <Card.Footer withBorder>
        <Text size="sm" fw={600}>
          Total spent: {formatMoney(totals.spent)} / {formatMoney(totals.limit)}
        </Text>
      </Card.Footer>
    </Card>,

    <Card
      key="travel"
      component="section"
      aria-labelledby="travel-title"
      padding="lg"
      radius="xl"
      shadow="sm"
      withBorder={false}
    >
      <Card.Section
        inheritPadding
        py="lg"
        bg="var(--mantine-color-blue-light)"
        c="var(--mantine-color-blue-light-color)"
      >
        <Text fw={600}>Your next adventure</Text>
      </Card.Section>
      <Card.Body>
        <Stack gap="md">
          <div>
            <Card.Title id="travel-title">Travel savings</Card.Title>
            <Card.Subtitle>A separate savings goal, outside your monthly budgets</Card.Subtitle>
          </div>
          <BudgetProgress
            value={travelSavings.saved}
            total={travelSavings.target}
            label="Travel savings progress"
            color="teal"
          />
        </Stack>
      </Card.Body>
    </Card>,

    <Card
      key="monthly"
      component="section"
      aria-labelledby="monthly-title"
      orientation="horizontal"
      padding="xs"
      radius="md"
      withBorder
    >
      <Card.Header withBorder>
        <div>
          <Card.Title id="monthly-title">Spent</Card.Title>
          <Card.Subtitle>Monthly overview</Card.Subtitle>
        </div>
      </Card.Header>
      <Card.Body style={{flex: 1}}>
        <Text fw={600}>
          {formatMoney(totals.spent)} / {formatMoney(totals.limit)}
        </Text>
      </Card.Body>
    </Card>,
  ];
  const columns = isDesktop
    ? [
        {key: 'left', cards: [cards[0], cards[2], cards[4]]},
        {key: 'right', cards: [cards[1], cards[3], cards[5]]},
      ]
    : [{key: 'mobile', cards}];

  return (
    <Stack gap="lg" miw={0}>
      <div>
        <Title order={2}>Budget examples</Title>
        <Text c="dimmed" mt="xs">
          Sample budgets showcasing different card layouts. These are demo values, not your actual budgets.
        </Text>
      </div>

      <SimpleGrid cols={{base: 1, md: 2}} spacing="lg" miw={0} style={{alignItems: 'start'}}>
        {columns.map(column => (
          <Stack key={column.key} gap="lg" miw={0}>
            {column.cards}
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
