'use client';

import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {useTranslations} from 'next-intl';
import {Fragment, type FC} from 'react';
import {CloseIconButton} from '@/components/Button';
import {CategoryChip} from '@/components/Category/CategoryChip';
import {PaymentMethodChip} from '@/components/PaymentMethod/PaymentMethodChip';
import {BasicTable, type ColumnDefinition} from '@/components/Table';
import {ZoomTransition} from '@/components/Transition';
import {Formatter} from '@/utils/Formatter';
import {useCurrencyPreference} from '@/utils/Formatter/PreferenceContext';
import type {TransactionDialogState} from './TransactionDialogState';

export type TransactionDialogProps = TransactionDialogState &
  Pick<DialogProps, 'onClose'> & {summary?: React.ReactNode};

export const TransactionDialog: FC<TransactionDialogProps> = ({
  isOpen,
  isLoading,
  transactions,
  error,
  onClose,
  summary,
}) => {
  const t = useTranslations('TransactionDialog');
  const currency = useCurrencyPreference();
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
      aria-labelledby="scroll-dialog-title"
      slots={{
        transition: ZoomTransition,
      }}
      slotProps={{
        paper: {
          elevation: 0,
        },
      }}
    >
      <DialogTitle id="scroll-dialog-title">{t('title', {count: transactions.length})}</DialogTitle>
      <CloseIconButton
        onClick={event => handleDialogClose(event, 'escapeKeyDown')}
        sx={theme => ({
          position: 'absolute',
          top: theme.spacing(1),
          right: theme.spacing(1),
        })}
      />
      <DialogContent sx={{p: 0}}>
        {summary}
        {isFullscreen && transactions.length > 0 && !isLoading && !error ? (
          <Box component="ul" sx={{listStyle: 'none', m: 0, p: 2, display: 'grid', gap: 1.5}}>
            {transactions.map(row => (
              <Box
                component="li"
                key={row.id}
                sx={{
                  minWidth: 0,
                  p: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                }}
              >
                <Box
                  component="dl"
                  sx={{
                    m: 0,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
                    columnGap: 2,
                    rowGap: 1,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {(
                    [
                      [t('receiver'), row.receiver],
                      [t('amount'), Formatter.currency.formatBalance(row.transferAmount, currency)],
                      [t('date'), Formatter.date.format(row.processedAt)],
                      [t('category'), row.category.name],
                      [t('paymentMethod'), row.paymentMethod.name],
                    ] as const
                  ).map(([label, value]) => (
                    <Fragment key={label}>
                      <Typography component="dt" variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography component="dd" variant="body2" sx={{m: 0}}>
                        {value}
                      </Typography>
                    </Fragment>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <BasicTable<TExpandedTransaction, 'id'>
            isLoading={isLoading}
            error={error}
            data={transactions}
            dataKey={'id'}
            sx={{borderRadius: 0}}
            tableProps={{
              sx: {
                bgcolor: 'background.paper',
                '& .MuiTableCell-root': {color: 'text.primary'},
                '& .MuiTableCell-stickyHeader': {bgcolor: 'background.paper'},
              },
            }}
            columns={
              [
                {
                  key: 'processedAt',
                  label: t('date'),
                  renderCell: (_, row) => Formatter.date.format(row.processedAt),
                },
                {
                  key: 'category',
                  label: t('category'),
                  renderCell: (_, row) => <CategoryChip categoryName={row.category.name} size="small" sx={{mr: 1}} />,
                },
                {
                  key: 'paymentMethod',
                  label: t('paymentMethod'),
                  renderCell: (_, row) => <PaymentMethodChip paymentMethodName={row.paymentMethod.name} size="small" />,
                },
                {
                  key: 'receiver',
                  label: t('receiver'),
                },
                {
                  key: 'transferAmount',
                  label: t('amount'),
                  align: 'right',
                  renderCell: (_, row) => Formatter.currency.formatBalance(row.transferAmount, currency),
                },
              ] satisfies ColumnDefinition<TExpandedTransaction>[]
            }
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={event => {
            handleDialogClose(event, 'escapeKeyDown');
          }}
        >
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
