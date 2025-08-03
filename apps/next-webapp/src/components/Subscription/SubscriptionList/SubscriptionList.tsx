'use client';

import { Card } from '@/components/Card';
import { CategoryChip } from '@/components/Category/CategoryChip';
import { ListWithIcon } from '@/components/ListWithIcon';
import { NoResults } from '@/components/NoResults';
import { PaymentMethodChip } from '@/components/PaymentMethod/PaymentMethodChip';
import { EntityListProps } from '@/components/Transaction/TransactionList';
import { Formatter } from '@/utils/Formatter';
import { AddRounded as AddIcon, ReceiptRounded as ReceiptIcon } from '@mui/icons-material';
import { Box, Chip, type ChipProps, CircularProgress, IconButton } from '@mui/material';
import React from 'react';

export type SubscriptionListProps = EntityListProps<{
  ID: string;
  receiver: string;
  nextExecution: Date;
  transferAmount: number;
  category: {
    ID: string;
    name: string;
  };
  paymentMethod: {
    ID: string;
    name: string;
  };
}>;

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  isLoading = false,
  title,
  subtitle,
  data,
  onAddEntity,
  cardProps,
  noResultsMessage = 'There are no subscriptions',
}) => {
  const chipProps: ChipProps = {
    variant: 'outlined',
    size: 'small',
    sx: { mr: 1 },
  };

  return (
    <Card {...cardProps}>
      <Card.Header sx={{ mb: 1 }}>
        <Box>
          <Card.Title>{title}</Card.Title>
          {subtitle !== undefined && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>
        {onAddEntity && (
          <Card.HeaderActions>
            <IconButton color="primary" onClick={onAddEntity}>
              <AddIcon />
            </IconButton>
          </Card.HeaderActions>
        )}
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <CircularProgress />
        ) : data.length > 0 ? (
          data.map((subscription) => {
            return (
              <ListWithIcon
                key={subscription.ID}
                icon={<ReceiptIcon />}
                title={subscription.receiver}
                subtitle={
                  <Box>
                    <Chip
                      label={'Next ' + Formatter.date.format(subscription.nextExecution, true)}
                      sx={{ mr: 1 }}
                      {...chipProps}
                    />
                    <CategoryChip categoryName={subscription.category.name} {...chipProps} />
                    <PaymentMethodChip
                      paymentMethodName={subscription.paymentMethod.name}
                      {...chipProps}
                    />
                  </Box>
                }
                amount={subscription.transferAmount}
              />
            );
          })
        ) : (
          <NoResults text={noResultsMessage} />
        )}
      </Card.Body>
    </Card>
  );
};
