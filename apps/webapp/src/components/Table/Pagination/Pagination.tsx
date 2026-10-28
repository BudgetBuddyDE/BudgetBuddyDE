'use client';

import {TablePagination} from '@mui/material';
import {useTranslations} from 'next-intl';
import type React from 'react';

export type PaginationProps = {
  count: number;
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
};

export const Pagination: React.FC<PaginationProps> = ({
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions = [15, 25, 50, 100],
  onPageChange,
  onRowsPerPageChange,
}) => {
  const t = useTranslations('Pagination');
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      labelRowsPerPage={t('rowsPerPage')}
      rowsPerPageOptions={rowsPerPageOptions}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      onRowsPerPageChange={event => onRowsPerPageChange(Number.parseInt(event.target.value, 10))}
    />
  );
};
