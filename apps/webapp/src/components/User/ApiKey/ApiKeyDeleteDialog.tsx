'use client';

import {useTranslations} from 'next-intl';
import React from 'react';
import {DeleteDialog} from '@/components/Dialog';

export type ApiKeyDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ApiKeyDeleteDialog: React.FC<ApiKeyDeleteDialogProps> = ({open, onClose, onConfirm}) => {
  const t = useTranslations('ApiKeyTable');
  return (
    <DeleteDialog
      open={open}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={onConfirm}
      text={{
        title: t('deleteDialogTitle'),
        content: t('deleteDialogDescription'),
      }}
    />
  );
};
