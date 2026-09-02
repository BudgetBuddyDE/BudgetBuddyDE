'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  type DialogProps as MuiDialogProps,
} from '@mui/material';
import type React from 'react';
import {SlideTransition} from '@/components/Transition';

export type DeleteDialogProps = Pick<MuiDialogProps, 'open' | 'onClose' | 'maxWidth' | 'transitionDuration'> & {
  onCancel: () => void;
  onConfirm: () => void;
  withTransition?: boolean;
  text?: Partial<{title: string; content: string}>;
};

/**
 * DeleteDialog component renders a confirmation dialog for deleting entries.
 */
export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  maxWidth = 'xs',
  onCancel,
  onConfirm,
  withTransition = false,
  text,
  transitionDuration,
}) => {
  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (onClose) onClose(event, reason);
      }}
      maxWidth={maxWidth}
      slotProps={{
        paper: {elevation: 0},
      }}
      transitionDuration={transitionDuration}
      slots={{
        transition: withTransition ? SlideTransition : undefined,
      }}
    >
      <DialogTitle variant="h2" sx={{textAlign: 'center'}}>
        {text?.title || 'Attention'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          variant="inherit"
          sx={{
            textAlign: 'center',
          }}
        >
          {text?.content || 'Are you sure you want to delete these entries?'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          Yes, delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
