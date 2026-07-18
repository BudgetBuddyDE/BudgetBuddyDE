'use client';

import AddIcon from '@mui/icons-material/AddRounded';
import ReceiptIcon from '@mui/icons-material/ReceiptRounded';
import {Box, Chip, type ChipProps, CircularProgress, IconButton} from '@mui/material';
import type React from 'react';
import {Card} from '@/components/Card';
import {CategoryChip} from '@/components/Category/CategoryChip';
import {IntentButton} from '@/components/IBN';
import {ListWithIcon} from '@/components/ListWithIcon';
import {NoResults} from '@/components/NoResults';
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import type {EntityListProps} from '@/components/Transaction/TransactionList';
import {Formatter} from '@/utils/Formatter';

export type RecurringPaymentListProps = EntityListProps<{
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

export const RecurringPaymentList: React.FC<RecurringPaymentListProps> = ({
  isLoading = false,
  title,
  subtitle,
  data,
  onAddEntity,
  cardProps,
  noResultsMessage = 'There are no recurring payments',
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
        <Card.HeaderActions>
          {onAddEntity ? (
            <IconButton color="primary" onClick={onAddEntity}>
              <AddIcon />
            </IconButton>
          ) : (
            <IntentButton
              intent={{entity: 'recurringPayment', action: 'create'}}
              iconButton
              aria-label="Create Recurring-Payment"
              color="primary"
            >
              <AddIcon />
            </IntentButton>
          )}
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <CircularProgress />
        ) : data.length > 0 ? (
          data.map(recurringPayment => {
            return (
              <ListWithIcon
                key={recurringPayment.ID}
                icon={<ReceiptIcon />}
                title={recurringPayment.receiver}
                subtitle={
                  <Box>
                    <Chip
                      label={`Next ${Formatter.date.format(recurringPayment.nextExecution, true)}`}
                      sx={{mr: 1}}
                      {...chipProps}
                    />
                    <CategoryChip categoryName={recurringPayment.category.name} {...chipProps} />
                    <PaymentMethodChip paymentMethodName={recurringPayment.paymentMethod.name} {...chipProps} />
                  </Box>
                }
                amount={recurringPayment.transferAmount}
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
