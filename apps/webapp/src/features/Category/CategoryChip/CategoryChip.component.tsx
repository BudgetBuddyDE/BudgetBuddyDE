import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {type TCategory} from '@/newTypes';

export type TCategoryChipProps = ChipProps & {category: TCategory};

export const CategoryChip: React.FC<TCategoryChipProps> = ({category, ...otherProps}) => {
  return <Chip label={category.name} variant="outlined" {...otherProps} />;
};
