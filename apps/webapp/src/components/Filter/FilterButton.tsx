'use client';

import FilterListRounded from '@mui/icons-material/FilterListRounded';
import {IconButton, type IconButtonProps, Tooltip} from '@mui/material';
import type React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type FilterButtonProps = Pick<IconButtonProps, 'onClick'> & {
  isActive?: boolean;
};

export const FilterButton: React.FC<FilterButtonProps> = ({isActive, onClick}) => {
  const t = useAppTranslations();
  return (
    <Tooltip title={isActive ? t('Filters active') : t('Filter')} placement="bottom">
      <IconButton
        color={isActive ? 'primary' : 'default'}
        aria-label={isActive ? t('Filters active') : t('Filter')}
        onClick={onClick}
      >
        <FilterListRounded />
      </IconButton>
    </Tooltip>
  );
};
