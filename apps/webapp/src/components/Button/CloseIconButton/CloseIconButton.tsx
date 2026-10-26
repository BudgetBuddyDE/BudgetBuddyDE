'use client';

import CloseIcon from '@mui/icons-material/Close';
import {IconButton, type IconButtonProps} from '@mui/material';
import {useTranslations} from 'next-intl';
import type React from 'react';

export type CloseIconButtonProps = Omit<IconButtonProps, 'children'>;

export const CloseIconButton: React.FC<CloseIconButtonProps> = ({...props}) => {
  const t = useTranslations('Actions');
  return (
    <IconButton aria-label={t('close')} {...props}>
      <CloseIcon />
    </IconButton>
  );
};
