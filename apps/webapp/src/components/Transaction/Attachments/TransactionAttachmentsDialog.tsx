import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {Dialog, DialogContent, DialogTitle, Typography} from '@mui/material';
import type React from 'react';
import {CloseIconButton} from '@/components/Button';
import {ErrorAlert} from '@/components/ErrorAlert';
import {ZoomTransition} from '@/components/Transition';
import {TransactionAttachments} from './TransactionAttachments';

/** Props for {@link TransactionAttachmentsDialog}. */
export type TransactionAttachmentsDialogProps = {
  /** Whether the dialog is open. */
  open: boolean;
  /** The transaction whose attachments are shown, or `null` when no transaction is selected. */
  transaction: TExpandedTransaction | null;
  /** Called when the dialog should be closed. */
  onClose: () => void;
};

/**
 * Modal dialog that wraps {@link TransactionAttachments} for a specific transaction.
 * Displays the transaction receiver in the title for context.
 */
export const TransactionAttachmentsDialog: React.FC<TransactionAttachmentsDialogProps> = ({
  open,
  transaction,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slots={{transition: ZoomTransition}}
      slotProps={{paper: {elevation: 0}}}
    >
      <DialogTitle>
        Attachments
        {transaction && (
          <Typography variant="body2" color="text.secondary" component="span" sx={{ml: 1}}>
            — {transaction.receiver}
          </Typography>
        )}
      </DialogTitle>
      <CloseIconButton
        onClick={() => onClose()}
        sx={theme => ({
          position: 'absolute',
          top: theme.spacing(1),
          right: theme.spacing(1),
        })}
      />
      <DialogContent sx={{pt: 0}}>
        {transaction ? (
          <TransactionAttachments transactionId={transaction.id} />
        ) : (
          <ErrorAlert error="No transaction selected. Please select a transaction to view its attachments." />
        )}
      </DialogContent>
    </Dialog>
  );
};
