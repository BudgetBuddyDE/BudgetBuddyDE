'use client';

import {Box, Progress, Stack, Text, Tooltip, createPolymorphicComponent} from '@mantine/core';
import type {PolymorphicComponentProps} from '@mantine/core';
import {Card} from '@/compositions/Cards/Card';
import type {CardProps} from '@/compositions/Cards/Card';
import classes from './BudgetOverviewCard.module.css';

export interface BudgetOverviewCardProps extends Omit<CardProps, 'children'> {
  children?: never;
  totalBudget: number;
  spent: number;
  futureExpenses: number;
}

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Presents the period's budget, planned expenses and available or overdrawn balance. */
export const BudgetOverviewCard = createPolymorphicComponent<'section', BudgetOverviewCardProps>(
  function BudgetOverviewCard({
    totalBudget,
    spent,
    futureExpenses,
    className,
    ...props
  }: PolymorphicComponentProps<'section', BudgetOverviewCardProps>) {
    const rawAvailable = totalBudget - spent - futureExpenses;
    const isOverBudget = rawAvailable < 0;
    const available = Math.max(0, rawAvailable);
    const spentPercent = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;
    const futurePercent =
      totalBudget > 0
        ? isOverBudget
          ? Math.min((futureExpenses / totalBudget) * 100, 100 - spentPercent)
          : (futureExpenses / totalBudget) * 100
        : 0;
    const availablePercent = totalBudget > 0 ? (available / totalBudget) * 100 : 0;

    const segments = [
      {label: 'Spent', amount: spent, percent: spentPercent, color: 'red'},
      {label: 'Upcoming Expenses', amount: futureExpenses, percent: futurePercent, color: 'yellow'},
      {
        label: isOverBudget ? 'Overdrawn' : 'Available',
        amount: isOverBudget ? Math.abs(rawAvailable) : available,
        percent: availablePercent,
        color: isOverBudget ? 'red' : 'green',
      },
    ];

    return (
      <Card component="section" withBorder {...props} className={[classes.root, className].filter(Boolean).join(' ')}>
        <Card.Header pb={8}>
          <Box className={classes.heading}>
            <Card.Title order={2} className={classes.title}>
              Budget
            </Card.Title>
            <Text component="p" className={classes.total}>
              {currencyFormatter.format(totalBudget)}
            </Text>
          </Box>
        </Card.Header>
        <Card.Body pt={0}>
          <Stack gap={16}>
            <Progress.Root size={16} radius={8} transitionDuration={300} role="img" aria-label="Budget progress">
              {segments.map(({label, amount, percent, color}) => (
                <Tooltip key={label} label={`${label} · ${currencyFormatter.format(amount)}`}>
                  <Progress.Section value={percent} color={color} withAria={false} aria-label={label} />
                </Tooltip>
              ))}
            </Progress.Root>

            <Box component="dl" className={classes.legend}>
              {segments.map(({label, amount, color}, index) => (
                <Box key={label} className={classes.row}>
                  <Text component="dt" className={classes.label}>
                    <Box component="span" className={classes.dot} bg={color} aria-hidden="true" />
                    <span>{label}</span>
                  </Text>
                  <Text component="dd" className={classes.amount} c={index === 2 && isOverBudget ? color : undefined}>
                    {currencyFormatter.format(amount)}
                  </Text>
                </Box>
              ))}
            </Box>
          </Stack>
        </Card.Body>
      </Card>
    );
  },
);
