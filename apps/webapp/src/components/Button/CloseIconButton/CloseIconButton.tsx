'use client';

import CloseIcon from '@mui/icons-material/Close';
import {IconButton, type IconButtonProps} from '@mui/material';
import type React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type CloseIconButtonProps = Omit<IconButtonProps, 'children'>;

export const CloseIconButton: React.FC<CloseIconButtonProps> = ({...props}) => {
  const t = useAppTranslations();
  return (
    <IconButton aria-label={t('common.closeMessage')} {...props}>
      <CloseIcon />
    </IconButton>
  );
};
