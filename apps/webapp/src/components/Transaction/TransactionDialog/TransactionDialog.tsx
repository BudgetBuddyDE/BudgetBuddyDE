'use client';

import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type React from 'react';
import {CloseIconButton} from '@/components/Button';
import {CategoryChip} from '@/components/Category/CategoryChip';
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import {BasicTable, type ColumnDefinition} from '@/components/Table';
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
          sx={{borderRadius: 0}}
          tableProps={{
            sx: {background: theme.palette.background.paper},
          }}
          columns={
            [
              {
                key: 'processedAt',
                label: 'Date',
                renderCell: (_, row) => Formatter.date.format(row.processedAt),
              },
              {
                key: 'category',
                label: 'Category',
                renderCell: (_, row) => <CategoryChip categoryName={row.category.name} size="small" sx={{mr: 1}} />,
              },
              {
                key: 'paymentMethod',
                label: 'Payment Method',
                renderCell: (_, row) => <PaymentMethodChip paymentMethodName={row.paymentMethod.name} size="small" />,
              },
              {
                key: 'receiver',
                label: 'Receiver',
              },
              {
                key: 'transferAmount',
                label: 'Amount',
                renderCell: (_, row) => Formatter.currency.formatBalance(row.transferAmount),
              },
            ] satisfies ColumnDefinition<TExpandedTransaction>[]
          }
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
