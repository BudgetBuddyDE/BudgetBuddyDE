'use client';

import {IconButton, Tooltip} from '@mui/material';
import React from 'react';

export type ActionButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

export const ActionButton: React.FC<ActionButtonProps> = ({label, onClick, children}) => (
  <Tooltip title={label}>
    <IconButton
      aria-label={label}
      size="small"
      onClick={onClick}
      sx={{
        color: 'text.secondary',
        '&:hover': {color: 'text.primary', backgroundColor: 'action.hover'},
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
);
