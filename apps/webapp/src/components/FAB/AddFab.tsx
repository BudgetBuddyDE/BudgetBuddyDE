'use client';

import AddIcon from '@mui/icons-material/AddRounded';
import type {FabProps} from '@mui/material';
import {Fab} from '@mui/material';
import type React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type AddFabProps = Omit<FabProps, 'children'> & {
  label?: string;
};

export const AddFab: React.FC<AddFabProps> = ({label, ...props}) => {
  const t = useAppTranslations();
  return (
    <Fab color="primary" variant="extended" aria-label={t('add')} {...props}>
      <AddIcon sx={{mr: 1}} />
      {label ?? t('Add')}
    </Fab>
  );
};
