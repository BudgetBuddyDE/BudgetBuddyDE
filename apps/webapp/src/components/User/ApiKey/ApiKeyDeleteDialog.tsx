'use client';

import React from 'react';
import {DeleteDialog} from '@/components/Dialog';

export type ApiKeyDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ApiKeyDeleteDialog: React.FC<ApiKeyDeleteDialogProps> = ({open, onClose, onConfirm}) => {
  return (
    <DeleteDialog
      open={open}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={onConfirm}
      text={{
        title: 'Delete API key',
        content:
          'Are you sure you want to delete this API key? Applications using it will lose access immediately. This action cannot be undone.',
      }}
    />
  );
};
