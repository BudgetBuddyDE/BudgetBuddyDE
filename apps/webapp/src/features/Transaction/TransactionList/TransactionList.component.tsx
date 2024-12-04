import {type TTransaction} from '@budgetbuddyde/types';
import {AddRounded as AddIcon, ReceiptRounded as ReceiptIcon} from '@mui/icons-material';
import {Box, Chip, type ChipProps, IconButton} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {Card, type TCardProps} from '@/components/Base/Card';
import {ListWithIcon} from '@/components/Base/ListWithIcon';
import {NoResults} from '@/components/NoResults';

export type TTransactionListProps = {
  title: string;
  subtitle?: string;
  noResultsMessage?: string;
  data: TTransaction[];
  onAddTransaction?: () => void;
  cardProps?: TCardProps;
};

export const TransactionList: React.FC<TTransactionListProps> = ({
  title,
  subtitle,
  noResultsMessage = "You haven't made any purchases yet",
  data,
  onAddTransaction,
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
        {onAddTransaction && (
          <Card.HeaderActions>
            <IconButton color="primary" onClick={onAddTransaction}>
              <AddIcon />
            </IconButton>
          </Card.HeaderActions>
        )}
      </Card.Header>
      <Card.Body>
        {data.length > 0 ? (
          data.map(transaction => (
            <ListWithIcon
              key={transaction.id}
              icon={<ReceiptIcon />}
              title={transaction.receiver}
              subtitle={
                <Box>
                  <Chip label={format(new Date(transaction.processed_at), 'dd.MM')} sx={{mr: 1}} {...chipProps} />
                  <Chip label={transaction.expand.category.name} {...chipProps} />
                </Box>
              }
              amount={transaction.transfer_amount}
            />
          ))
        ) : (
          <NoResults text={noResultsMessage} />
        )}
      </Card.Body>
    </Card>
  );
};
