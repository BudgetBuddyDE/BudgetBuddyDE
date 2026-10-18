'use client';

import React from 'react';
import {DeleteDialog} from '@/components/Dialog';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type ApiKeyDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ApiKeyDeleteDialog: React.FC<ApiKeyDeleteDialogProps> = ({open, onClose, onConfirm}) => {
  const t = useAppTranslations();
  return (
    <DeleteDialog
      open={open}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={onConfirm}
      text={{
        title: t('account.apiKeys.deleteAPIKey'),
        content: t('account.apiKeys.deleteConfirmation'),
      }}
    />
  );
};
