'use client';

import FilterListRounded from '@mui/icons-material/FilterListRounded';
import {IconButton, type IconButtonProps, Tooltip} from '@mui/material';
import {useTranslations} from 'next-intl';
import type React from 'react';

export type FilterButtonProps = Pick<IconButtonProps, 'onClick'> & {
  isActive?: boolean;
};

export const FilterButton: React.FC<FilterButtonProps> = ({isActive, onClick}) => {
  const t = useTranslations('Filters');
  const label = isActive ? t('activeTooltip') : t('filter');
  return (
    <Tooltip title={label} placement="bottom">
      <IconButton color={isActive ? 'primary' : 'default'} aria-label={label} onClick={onClick}>
        <FilterListRounded />
      </IconButton>
    </Tooltip>
  );
};
