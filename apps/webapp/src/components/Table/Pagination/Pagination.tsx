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
      labelRowsPerPage={t('table.rows')}
      labelDisplayedRows={({from, to, count}) =>
        t('table.fromToOfCount', {from, to, count: count !== -1 ? count : t('table.moreThanTo', {to})})
      }
      getItemAriaLabel={type =>
        ({
          first: t('table.goToFirstPage'),
          last: t('table.goToLastPage'),
          next: t('table.goToNextPage'),
          previous: t('table.goToPreviousPage'),
        })[type]
      }
      rowsPerPageOptions={rowsPerPageOptions}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      onRowsPerPageChange={event => onRowsPerPageChange(Number.parseInt(event.target.value, 10))}
    />
  );
};
