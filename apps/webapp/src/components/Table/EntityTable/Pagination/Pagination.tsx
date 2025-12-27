'use client';

import {TablePagination} from '@mui/material';
import type React from 'react';
import {ITEMS_IN_VIEW} from '../EntityTable';

export type PaginationProps = {
  count: number;
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  onChangePage: (newPage: number) => void;
  onChangeRowsPerPage: (newRowsPerPage: number) => void;
};

export const Pagination: React.FC<PaginationProps> = ({
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions = [ITEMS_IN_VIEW, 10, 25, 50, 100],
  onChangePage,
  onChangeRowsPerPage,
}) => {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      labelRowsPerPage={'Rows:'}
      rowsPerPageOptions={rowsPerPageOptions}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, page) => {
        return onChangePage(page);
      }}
      onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        return onChangeRowsPerPage(parseInt(event.target.value, 10));
      }}
    />
  );
};
