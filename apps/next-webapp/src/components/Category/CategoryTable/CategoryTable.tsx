'use client';

import { EntityTable } from '@/components/Table/EntityTable';
import { type TCategory } from '@/types';
import { TableCell, TableRow, Typography } from '@mui/material';
import React from 'react';

export type CategoryTableProps = {
  categories: TCategory[];
};

export const CategoryTable: React.FC<CategoryTableProps> = ({ categories }) => {
  return (
    <EntityTable<TCategory>
      title="Categories"
      subtitle="In a table..."
      data={categories}
      dataKey={'ID'}
      headerCells={[
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
      ]}
      renderRow={(cell, item, data) => {
        const key = cell;
        const rowKey = String(item[key]);
        return (
          <TableRow key={rowKey}>
            <TableCell>
              <Typography variant="body1">{item.name}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body1">{item.description || 'No description'}</Typography>
            </TableCell>
          </TableRow>
        );
      }}
      slots={{
        title: { showCount: true },
        noResults: { text: 'No categories found' },
      }}
    />
  );
};
