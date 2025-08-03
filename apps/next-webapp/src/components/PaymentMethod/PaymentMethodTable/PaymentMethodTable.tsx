'use client';

import { EntityTable } from '@/components/Table/EntityTable';
import { type TPaymentMethod } from '@/types';
import { TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';

export type PaymentMethodTableProps = {
  paymentMethods: TPaymentMethod[];
};

export const PaymentMethodTable: React.FC<PaymentMethodTableProps> = ({ paymentMethods }) => {
  return (
    <EntityTable<TPaymentMethod>
      title="Payment Methods"
      subtitle="In a table..."
      data={paymentMethods}
      dataKey={'ID'}
      headerCells={[
        { key: 'name', label: 'Name' },
        { key: 'address', label: 'Address' },
        { key: 'provider', label: 'Provider' },
        { key: 'description', label: 'Description' },
      ]}
      renderRow={(cell, item, data) => {
        const key = cell;
        const rowKey = String(item[key]);
        return (
          <TableRow key={rowKey}>
            <TableCell>
              <Typography variant="body1">{item.name}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.address}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.provider}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.description || 'No description'}</Typography>
            </TableCell>
          </TableRow>
        );
      }}
      slots={{
        title: { showCount: true },
        noResults: { text: 'No payment methods found' },
      }}
    />
  );
};
