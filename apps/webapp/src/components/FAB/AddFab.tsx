'use client';

import AddIcon from '@mui/icons-material/AddRounded';
import type {FabProps} from '@mui/material';
import {Fab} from '@mui/material';
import {useTranslations} from 'next-intl';
import type React from 'react';

export type AddFabProps = Omit<FabProps, 'children'> & {
  label?: string;
};

export const AddFab: React.FC<AddFabProps> = ({label, ...props}) => {
  const t = useTranslations('Actions');
  return (
    <Fab color="primary" variant="extended" aria-label={label ?? t('add')} {...props}>
      <AddIcon sx={{mr: 1}} />
      {label ?? t('add')}
    </Fab>
  );
};
