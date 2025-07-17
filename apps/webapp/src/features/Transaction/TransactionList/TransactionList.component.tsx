import {AddRounded as AddIcon, ReceiptRounded as ReceiptIcon} from '@mui/icons-material';
import {Box, Chip, type ChipProps, IconButton} from '@mui/material';
import React from 'react';

import {Card, type TCardProps} from '@/components/Base/Card';
import {ListWithIcon} from '@/components/Base/ListWithIcon';
import {NoResults} from '@/components/NoResults';
import {CategoryChip} from '@/features/Category';
import {PaymentMethodChip} from '@/features/PaymentMethod';
import {type TExpandedTransaction} from '@/newTypes';
import {Formatter} from '@/services/Formatter';

export type TEntityListProps<T> = {
  isLoading?: boolean;
  title: string;
  subtitle?: string;
  noResultsMessage?: string;
  data: T[];
  onAddEntity?: () => void;
  cardProps?: TCardProps;
};

export type TTransactionListProps = TEntityListProps<TExpandedTransaction>;

export const TransactionList: React.FC<TTransactionListProps> = ({
  title,
  subtitle,
  noResultsMessage = "You haven't made any purchases yet",
  data,
  onAddEntity,
  cardProps,
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
          {subtitle !== undefined && subtitle.length > 0 && <Card.Subtitle>{subtitle}</Card.Subtitle>}
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
        {data.length > 0 ? (
          data.map(transaction => (
            <ListWithIcon
              key={transaction.ID}
              icon={<ReceiptIcon />}
              title={transaction.receiver}
              subtitle={
                <Box>
                  <Chip
                    label={Formatter.formatDate().format(transaction.processedAt, true)}
                    sx={{mr: 1}}
                    {...chipProps}
                  />
                  <CategoryChip category={transaction.toCategory} {...chipProps} />
                  <PaymentMethodChip paymentMethod={transaction.toPaymentMethod} {...chipProps} />
                </Box>
              }
              amount={transaction.transferAmount}
            />
          ))
        ) : (
          <NoResults text={noResultsMessage} />
        )}
      </Card.Body>
    </Card>
  );
};
