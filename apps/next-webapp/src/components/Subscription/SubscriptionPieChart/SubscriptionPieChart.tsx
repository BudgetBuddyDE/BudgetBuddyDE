'use client';

import { Box, Button, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React from 'react';
import NextLink from 'next/link';
import { PieChart, type PieChartData } from '@/components/Charts';
import { Card } from '@/components/Card';
import { CircularProgress } from '@/components/Loading';
import { Formatter } from '@/utils/Formatter';
import { NoResults } from '@/components/NoResults';

// REVISIT: Rework this chart when the backend is ready
export const SubscriptionPieChart = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [subscriptionType, setSubscriptionType] = React.useState<'INCOME' | 'EXPENSES'>('INCOME');

  const onChangeSubscriptionType = React.useCallback(
    (_: React.MouseEvent<HTMLElement>, newType: typeof subscriptionType) => {
      setSubscriptionType(newType);
    },
    []
  );

  const chartData: PieChartData[] = React.useMemo(() => {
    return [
      { label: 'Category A', value: 40 },
      { label: 'Category B', value: 30 },
      { label: 'Category C', value: 30 },
    ];
    // if (!subscriptions) return [];

    // const grouped = new Map<string, { name: string; total: number }>();
    // for (const {
    //   paused,
    //   transferAmount,
    //   toCategory: { ID: categoryId, name: categoryName },
    // } of subscriptions) {
    //   if (
    //     paused ||
    //     (subscriptionType === 'INCOME' && transferAmount <= 0) ||
    //     (subscriptionType === 'EXPENSES' && transferAmount >= 0)
    //   ) {
    //     continue;
    //   }

    //   const amount = Math.abs(transferAmount);
    //   if (grouped.has(categoryId)) {
    //     const curr = grouped.get(categoryId)!;
    //     grouped.set(categoryId, { name: categoryName, total: curr.total + amount });
    //   } else grouped.set(categoryId, { name: categoryName, total: amount });
    // }

    // return Array.from(grouped.values()).map(({ name, total }) => ({ label: name, value: total }));
  }, [subscriptionType]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      // Simulate data fetching
      console.log('Fetching subscription data...');
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [subscriptionType]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Recurring Payments</Card.Title>
          <Card.Subtitle>Monthly recurring payments</Card.Subtitle>
        </Box>

        <Card.HeaderActions sx={{ display: 'flex', flexDirection: 'row' }}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={subscriptionType}
            onChange={onChangeSubscriptionType}
            exclusive
          >
            {(['INCOME', 'EXPENSES'] as (typeof subscriptionType)[]).map((type) => (
              <ToggleButton key={type.toLowerCase()} value={type}>
                {type.substring(0, 1) + type.substring(1).toLowerCase()}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Card.HeaderActions>
      </Card.Header>
      {isLoading ? (
        <CircularProgress />
      ) : chartData.length > 0 ? (
        <React.Fragment>
          <Card.Body sx={{ mt: 1 }}>
            <PieChart
              fullWidth
              primaryText={Formatter.currency.formatBalance(
                chartData.reduce((acc, curr) => acc + curr.value, 0)
              )}
              secondaryText="Total"
              series={[
                {
                  data: chartData,
                  valueFormatter: (value) => Formatter.currency.formatBalance(value.value),
                },
              ]}
            />
          </Card.Body>
          <Card.Footer>
            <Stack direction="row" justifyContent={'flex-end'}>
              <Button LinkComponent={NextLink} href="/subscriptions">
                View more...
              </Button>
            </Stack>
          </Card.Footer>
        </React.Fragment>
      ) : (
        <NoResults sx={{ mt: 1 }} />
      )}
    </Card>
  );
};
