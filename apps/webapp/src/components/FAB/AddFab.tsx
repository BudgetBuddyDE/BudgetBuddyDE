'use client';

import {AddRounded as AddIcon} from '@mui/icons-material';
import type {FabProps} from '@mui/material';
import {Fab} from '@mui/material';
import type React from 'react';

export type AddFabProps = Omit<FabProps, 'children'> & {
  label?: string;
};

export const AddFab: React.FC<AddFabProps> = ({label = 'Add', ...props}) => {
  return (
    <Fab color="primary" variant="extended" aria-label="add" {...props}>
      <AddIcon sx={{mr: 1}} />
      {label}
    </Fab>
  );
};
