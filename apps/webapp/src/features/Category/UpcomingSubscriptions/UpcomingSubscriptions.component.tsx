import {type TCategory} from '@budgetbuddyde/types';
import {PaymentsRounded} from '@mui/icons-material';
import {Box} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {ListWithIcon} from '@/components/Base/ListWithIcon';
import {CircularProgress} from '@/components/Loading';
import {useSubscriptions} from '@/features/Subscription';
import {Formatter} from '@/services/Formatter';

export type TUpcomingSubscriptionProps = {};

export const UpcomingSubscriptions: React.FC<TUpcomingSubscriptionProps> = ({}) => {
  const {isLoading: isLoadingSubscriptions, data, getUpcomingSubscriptionPaymentsByCategory} = useSubscriptions();

  const groupedPayments: {label: TCategory['name']; total: number}[] = React.useMemo(() => {
    const upcomingPayments = getUpcomingSubscriptionPaymentsByCategory();

    const grouped = new Map<string, number>();
    for (const [_, {category, total}] of upcomingPayments) {
      grouped.set(category.name, total + (grouped.get(category.name) ?? 0));
    }

    return Array.from(grouped.entries()).map(([label, total]) => ({label, total}));
  }, [data]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Upcoming subscriptions</Card.Title>
          <Card.Subtitle>
            {Formatter.formatBalance(
              groupedPayments.length > 0 ? groupedPayments.reduce((acc, curr) => acc + curr.total, 0) : 0,
            )}{' '}
            grouped by category
          </Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        {isLoadingSubscriptions ? (
          <CircularProgress />
        ) : (
          groupedPayments.map(({label, total}) => (
            <ListWithIcon
              key={'upc-sub-' + label.replaceAll(' ', '_').toLowerCase()}
              icon={<PaymentsRounded />}
              title={label}
              amount={total}
            />
          ))
        )}
      </Card.Body>
    </Card>
  );
};
