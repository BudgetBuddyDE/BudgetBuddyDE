'use client';

import CloseIcon from '@mui/icons-material/Close';
import {IconButton, type IconButtonProps} from '@mui/material';
import type React from 'react';

export type CloseIconButtonProps = Omit<IconButtonProps, 'children'>;

export const CloseIconButton: React.FC<CloseIconButtonProps> = ({...props}) => {
  return (
    <IconButton aria-label="close" {...props}>
      <CloseIcon />
    </IconButton>
  );
};
