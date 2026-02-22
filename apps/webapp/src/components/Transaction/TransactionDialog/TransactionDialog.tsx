'use client';

import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  TableCell,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import {CloseIconButton} from '@/components/Button';
import {CategoryChip} from '@/components/Category/CategoryChip';
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import {BasicTable} from '@/components/Table/BasicTable';
import {ZoomTransition} from '@/components/Transition';
import {Formatter} from '@/utils/Formatter';
import type {TransactionDialogState} from './TransactionDialogState';

export type TransactionDialogProps = TransactionDialogState & Pick<DialogProps, 'onClose'>;

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  isLoading,
  transactions,
  error,
  onClose,
}) => {
  const theme = useTheme();
  const isFullscreen = useMediaQuery(theme.breakpoints.down('md'));
  const dialogMaxWidth: DialogProps['maxWidth'] = isFullscreen ? undefined : 'md';

  const handleDialogClose: DialogProps['onClose'] = (event, reason) => {
    if (onClose !== undefined) onClose(event, reason);
  };

  return (
    <Dialog
      fullScreen={isFullscreen}
      maxWidth={dialogMaxWidth}
      fullWidth
      open={isOpen}
      onClose={handleDialogClose}
      scroll={'paper'}
      slots={{
        transition: ZoomTransition,
      }}
      slotProps={{
        paper: {
          elevation: 0,
        },
      }}
    >
      <DialogTitle id="scroll-dialog-title">Transactions</DialogTitle>
      <CloseIconButton
        onClick={event => handleDialogClose(event, 'escapeKeyDown')}
        sx={theme => ({
          position: 'absolute',
          top: theme.spacing(1),
          right: theme.spacing(1),
        })}
      />
      <DialogContent sx={{p: 0}}>
        <BasicTable<TExpandedTransaction, 'id'>
          isLoading={isLoading}
          error={error}
          data={transactions}
          dataKey={'id'}
          slots={{
            table: {
              size: 'medium',
            },
          }}
          headerCells={[
            {key: 'processedAt', label: 'Date'},
            {key: 'category', label: 'Category'},
            {key: 'paymentMethod', label: 'Payment Method'},
            {key: 'receiver', label: 'Receiver'},
            {key: 'transferAmount', label: 'Amount'},
          ]}
          renderRow={(cell, item, _list) => {
            const key = cell;
            const _rowKey = String(item[key]);
            return (
              <React.Fragment key={cell}>
                <TableCell>{Formatter.date.format(item.processedAt)}</TableCell>
                <TableCell>
                  <CategoryChip categoryName={item.category.name} size="small" sx={{mr: 1}} />
                </TableCell>
                <TableCell>
                  <PaymentMethodChip paymentMethodName={item.paymentMethod.name} size="small" />
                </TableCell>
                <TableCell>{item.receiver}</TableCell>
                <TableCell>{Formatter.currency.formatBalance(item.transferAmount)}</TableCell>
              </React.Fragment>
            );
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={event => {
            handleDialogClose(event, 'escapeKeyDown');
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
