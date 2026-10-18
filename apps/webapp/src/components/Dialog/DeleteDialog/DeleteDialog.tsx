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
import {useAppTranslations} from '@/hooks/useAppTranslations';

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
  const t = useAppTranslations();
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
        {text?.title || t('common.attention')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          variant="inherit"
          sx={{
            textAlign: 'center',
          }}
        >
          {text?.content || t('common.areYouSureYouWantToDeleteTheseEntries')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          {t('common.yesDelete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
