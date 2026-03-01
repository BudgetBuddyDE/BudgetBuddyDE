'use client';

import {FilterListRounded} from '@mui/icons-material';
import {IconButton, type IconButtonProps, Tooltip} from '@mui/material';
import type React from 'react';

export type FilterButtonProps = Pick<IconButtonProps, 'onClick'> & {
  isActive?: boolean;
};

export const FilterButton: React.FC<FilterButtonProps> = ({isActive, onClick}) => {
  return (
    <Tooltip title={isActive ? 'Filters active' : 'Filter'} placement="bottom">
      <IconButton color={isActive ? 'primary' : 'default'} onClick={onClick}>
        <FilterListRounded />
      </IconButton>
    </Tooltip>
  );
};
