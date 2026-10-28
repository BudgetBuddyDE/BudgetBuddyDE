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
import {useTranslations} from 'next-intl';
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
  const t = useTranslations('DeleteDialog');
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
        {text?.title || t('title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          variant="inherit"
          sx={{
            textAlign: 'center',
          }}
        >
          {text?.content || t('content')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
