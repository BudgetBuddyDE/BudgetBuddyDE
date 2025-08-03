import { Chip, type ChipProps } from '@mui/material';
import React from 'react';

export type CategoryChipProps = ChipProps & { categoryName: string };

export const CategoryChip: React.FC<CategoryChipProps> = ({ categoryName, ...otherProps }) => {
  return <Chip label={categoryName} variant="outlined" {...otherProps} />;
};
