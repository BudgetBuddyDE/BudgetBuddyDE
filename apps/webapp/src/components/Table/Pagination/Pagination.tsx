'use client';

import {TablePagination} from '@mui/material';
import type React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

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
  const t = useAppTranslations();
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      labelRowsPerPage={t('Rows:')}
      labelDisplayedRows={({from, to, count}) =>
        t('{from}–{to} of {count}', {from, to, count: count !== -1 ? count : t('more than {to}', {to})})
      }
      getItemAriaLabel={type =>
        ({
          first: t('Go to first page'),
          last: t('Go to last page'),
          next: t('Go to next page'),
          previous: t('Go to previous page'),
        })[type]
      }
      rowsPerPageOptions={rowsPerPageOptions}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      onRowsPerPageChange={event => onRowsPerPageChange(Number.parseInt(event.target.value, 10))}
    />
  );
};
