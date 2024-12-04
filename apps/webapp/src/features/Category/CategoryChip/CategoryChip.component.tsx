import {type TCategory} from '@budgetbuddyde/types';
import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {useFilterStore} from '@/components/Filter';

export type TCategoryChipProps = ChipProps & {category: TCategory};

export const CategoryChip: React.FC<TCategoryChipProps> = ({category, ...otherProps}) => {
  const {filters, setFilters} = useFilterStore();

  const handleChipClick = () => {
    if (!filters.categories) {
      setFilters({
        ...filters,
        categories: [category.id],
      });
      return;
    }
    setFilters({
      ...filters,
      categories: [...filters.categories, category.id],
    });
  };

  const handleChipDelete = () => {
    if (!filters.categories || !filters.categories.includes(category.id)) return;
    setFilters({
      ...filters,
      categories: filters.categories.filter(id => id !== category.id),
    });
  };

  return (
    <Chip
      onClick={handleChipClick}
      onDelete={filters.categories && filters.categories.includes(category.id) ? handleChipDelete : undefined}
      label={category.name}
      variant="outlined"
      {...otherProps}
    />
  );
};
