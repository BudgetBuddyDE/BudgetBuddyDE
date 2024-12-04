import {Box, Button, Stack, ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {Link} from 'react-router-dom';

import {Card} from '@/components/Base/Card';
import {type TPieChartData} from '@/components/Base/Charts';
import {PieChart} from '@/components/Base/Charts';
import {CircularProgress} from '@/components/Loading';
import {Formatter} from '@/services/Formatter';

import {useSubscriptions} from '../useSubscriptions.hook';

export const SubscriptionPieChart = () => {
  const {isLoading, data: subscriptions} = useSubscriptions();
  const [subscriptionType, setSubscriptionType] = React.useState<'INCOME' | 'EXPENSES'>('INCOME');

  const onChangeSubscriptionType = React.useCallback(
    (_: React.MouseEvent<HTMLElement>, newType: typeof subscriptionType) => {
      setSubscriptionType(newType);
    },
    [],
  );

  const chartData: TPieChartData[] = React.useMemo(() => {
    if (!subscriptions) return [];

    const grouped = new Map<string, {name: string; total: number}>();
    for (const {
      paused,
      transfer_amount,
      expand: {
        category: {id, name},
      },
    } of subscriptions) {
      if (
        paused ||
        (subscriptionType === 'INCOME' && transfer_amount <= 0) ||
        (subscriptionType === 'EXPENSES' && transfer_amount >= 0)
      ) {
        continue;
      }

      const amount = Math.abs(transfer_amount);
      if (grouped.has(id)) {
        const curr = grouped.get(id)!;
        grouped.set(id, {name, total: curr.total + amount});
      } else grouped.set(id, {name, total: amount});
    }

    return Array.from(grouped.values()).map(({name, total}) => ({label: name, value: total}));
  }, [subscriptions, subscriptionType]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Recurring Payments</Card.Title>
          <Card.Subtitle>Monthly recurring payments</Card.Subtitle>
        </Box>

        <Card.HeaderActions sx={{display: 'flex', flexDirection: 'row'}}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={subscriptionType}
            onChange={onChangeSubscriptionType}
            exclusive>
            {(['INCOME', 'EXPENSES'] as (typeof subscriptionType)[]).map(type => (
              <ToggleButton key={type.toLowerCase()} value={type}>
                {type.substring(0, 1) + type.substring(1).toLowerCase()}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Card.HeaderActions>
      </Card.Header>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <React.Fragment>
          <Card.Body sx={{pt: 1}}>
            <PieChart
              fullWidth
              primaryText={Formatter.formatBalance(chartData.reduce((acc, curr) => acc + curr.value, 0))}
              secondaryText="Total"
              series={[
                {
                  data: chartData,
                  valueFormatter: value => Formatter.formatBalance(value.value),
                },
              ]}
            />
          </Card.Body>
          <Card.Footer>
            <Stack direction="row" justifyContent={'flex-end'}>
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/*@ts-expect-error*/}
              <Button LinkComponent={Link} to="/subscriptions">
                View more...
              </Button>
            </Stack>
          </Card.Footer>
        </React.Fragment>
      )}
    </Card>
  );
};
