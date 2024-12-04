import {AddRounded as AddIcon} from '@mui/icons-material';
import {Fab} from '@mui/material';
import type {FabProps} from '@mui/material';
import React from 'react';

export type TAddFabProps = {
  onClick: FabProps['onClick'];
};

export const AddFab: React.FC<TAddFabProps> = ({onClick}) => {
  return (
    <Fab color="primary" variant="extended" aria-label="add" onClick={onClick}>
      <AddIcon sx={{mr: 1}} />
      Add
    </Fab>
  );
};
