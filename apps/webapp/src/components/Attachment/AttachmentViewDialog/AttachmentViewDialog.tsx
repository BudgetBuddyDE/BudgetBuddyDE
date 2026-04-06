'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Box, Dialog, DialogContent, type DialogProps, DialogTitle} from '@mui/material';
import type React from 'react';
import {CloseIconButton} from '@/components/Button';
import {ZoomTransition} from '@/components/Transition';

export type AttachmentViewDialogProps = {
  open: boolean;
  attachment: TAttachmentWithUrl | null;
  onClose: DialogProps['onClose'];
};

export const AttachmentViewDialog: React.FC<AttachmentViewDialogProps> = ({open, attachment, onClose}) => {
  if (!attachment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slots={{transition: ZoomTransition}}
      slotProps={{paper: {elevation: 0}}}
    >
      <DialogTitle sx={{pr: 6}}>{attachment.fileName}</DialogTitle>
      <CloseIconButton
        onClick={event => onClose?.(event, 'escapeKeyDown')}
        sx={theme => ({
          position: 'absolute',
          top: theme.spacing(1),
          right: theme.spacing(1),
        })}
      />
      <DialogContent sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2}}>
        <Box
          component="img"
          src={attachment.signedUrl}
          alt={attachment.fileName}
          sx={{maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 1}}
        />
      </DialogContent>
    </Dialog>
  );
};
