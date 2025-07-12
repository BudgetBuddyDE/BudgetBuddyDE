import {Chip, type ChipProps} from '@mui/material';
import React from 'react';

import {useFilterStore} from '@/components/Filter';
import {type TCategory} from '@/newTypes';

export type TCategoryChipProps = ChipProps & {category: TCategory};

export const CategoryChip: React.FC<TCategoryChipProps> = ({category, ...otherProps}) => {
  const {filters, setFilters} = useFilterStore();

  const handleChipClick = () => {
    if (!filters.categories) {
      setFilters({
        ...filters,
        categories: [category.ID],
      });
      return;
    }
    setFilters({
      ...filters,
      categories: [...filters.categories, category.ID],
    });
  };

  const handleChipDelete = () => {
    if (!filters.categories || !filters.categories.includes(category.ID)) return;
    setFilters({
      ...filters,
      categories: filters.categories.filter(id => id !== category.ID),
    });
  };

  return (
    <Chip
      onClick={handleChipClick}
      onDelete={filters.categories && filters.categories.includes(category.ID) ? handleChipDelete : undefined}
      label={category.name}
      variant="outlined"
      {...otherProps}
    />
  );
};
