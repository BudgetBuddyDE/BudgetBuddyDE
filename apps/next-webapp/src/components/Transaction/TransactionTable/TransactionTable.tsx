'use client';

import { ActionPaper } from '@/components/ActionPaper';
import { CategoryChip } from '@/components/Category/CategoryChip';
import { PaymentMethodChip } from '@/components/PaymentMethod/PaymentMethodChip';
import { EntityTable } from '@/components/Table/EntityTable';
import { type TExpandedTransaction } from '@/types';
import { Formatter } from '@/utils/Formatter';
import { MoreVertRounded } from '@mui/icons-material';
import { IconButton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';

export type TransactionTableProps = {
  transactions: TExpandedTransaction[];
};

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  return (
    <EntityTable<TExpandedTransaction>
      title="Transactions"
      subtitle="In a table..."
      data={transactions}
      dataKey={'ID'}
      headerCells={[
        { key: 'processedAt', label: 'Processed at' },
        { key: 'receiver', label: 'Details' },
        { key: 'transferAmount', label: 'Transfer Amount' },
        { key: 'information', label: 'Information' },
        { label: '', placeholder: true },
      ]}
      renderRow={(cell, item, data) => {
        const key = cell;
        const rowKey = String(item[key]);
        return (
          <TableRow key={rowKey}>
            <TableCell>
              <Typography variant="body1">{Formatter.date.format(item.processedAt)}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.receiver}</Typography>
              <Stack flexDirection={'row'}>
                <CategoryChip categoryName={item.toCategory.name} size="small" sx={{ mr: 1 }} />
                <PaymentMethodChip paymentMethodName={item.toPaymentMethod.name} size="small" />
              </Stack>
            </TableCell>
            <TableCell>
              <Typography variant="body1">
                {Formatter.currency.formatBalance(item.transferAmount)}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.information}</Typography>
            </TableCell>
            <TableCell align="right">
              <ActionPaper sx={{ width: 'fit-content', ml: 'auto' }}>
                <IconButton>
                  <MoreVertRounded />
                </IconButton>
              </ActionPaper>
            </TableCell>
          </TableRow>
        );
      }}
      slots={{
        title: { showCount: true },
        noResults: { text: 'No transactions found' },
      }}
    />
  );
};
