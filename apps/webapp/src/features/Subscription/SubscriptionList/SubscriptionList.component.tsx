import {AddRounded as AddIcon, ReceiptRounded as ReceiptIcon} from '@mui/icons-material';
import {Box, Chip, type ChipProps, IconButton} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {ListWithIcon} from '@/components/Base/ListWithIcon';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {type TExpandedSubscription} from '@/newTypes';
import {Formatter} from '@/services/Formatter';

export type TSubscriptionListProps = {
  isLoading?: boolean;
  title: string;
  subtitle?: string;
  subscriptions: TExpandedSubscription[];
  onAddSubscription?: () => void;
};

export const SubscriptionList: React.FC<TSubscriptionListProps> = ({
  isLoading = false,
  title,
  subtitle,
  subscriptions,
  onAddSubscription,
}) => {
  const chipProps: ChipProps = {
    variant: 'outlined',
    size: 'small',
    sx: {mr: 1},
  };

  return (
    <Card>
      <Card.Header sx={{mb: 1}}>
        <Box>
          <Card.Title>{title}</Card.Title>
          {subtitle !== undefined && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>
        {onAddSubscription && (
          <Card.HeaderActions>
            <IconButton color="primary" onClick={onAddSubscription}>
              <AddIcon />
            </IconButton>
          </Card.HeaderActions>
        )}
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <CircularProgress />
        ) : subscriptions.length > 0 ? (
          subscriptions.map(subscription => {
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
                    <Chip label={subscription.toCategory.name} {...chipProps} />
                  </Box>
                }
                amount={subscription.transferAmount}
              />
            );
          })
        ) : (
          <NoResults text="There are not subscriptions" />
        )}
      </Card.Body>
    </Card>
  );
};
