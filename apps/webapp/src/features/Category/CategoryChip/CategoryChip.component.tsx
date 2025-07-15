import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {type TCategory} from '@/newTypes';

import {useCategories} from '../useCategories.hook';

export type TCategoryChipProps = ChipProps & {category: TCategory | string};

export const CategoryChip: React.FC<TCategoryChipProps> = ({category, ...otherProps}) => {
  const {isLoading, data: categories} = useCategories();

  if (isLoading) return null;
  return (
    <Chip
      label={typeof category === 'string' ? (categories?.find(({ID}) => ID === category)?.name ?? '') : category.name}
      variant="outlined"
      {...otherProps}
    />
  );
};
