import {AddRounded as AddIcon, ReceiptRounded as ReceiptIcon} from '@mui/icons-material';
import {Box, Chip, type ChipProps, IconButton} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {ListWithIcon} from '@/components/Base/ListWithIcon';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {CategoryChip} from '@/features/Category';
import {PaymentMethodChip} from '@/features/PaymentMethod';
import {type TEntityListProps} from '@/features/Transaction';
import {type TExpandedSubscription} from '@/newTypes';
import {Formatter} from '@/services/Formatter';

export type TSubscriptionListProps = TEntityListProps<TExpandedSubscription>;

export const SubscriptionList: React.FC<TSubscriptionListProps> = ({
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
    sx: {mr: 1},
  };

  return (
    <Card {...cardProps}>
      <Card.Header sx={{mb: 1}}>
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
          data.map(subscription => {
            return (
              <ListWithIcon
                key={subscription.ID}
                icon={<ReceiptIcon />}
                title={subscription.receiver}
                subtitle={
                  <Box>
                    <Chip
                      label={'Next ' + Formatter.formatDate().format(subscription.nextExecution, true)}
                      sx={{mr: 1}}
                      {...chipProps}
                    />
                    <CategoryChip category={subscription.toCategory} {...chipProps} />
                    <PaymentMethodChip paymentMethod={subscription.toPaymentMethod} {...chipProps} />
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
