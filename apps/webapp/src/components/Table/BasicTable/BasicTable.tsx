'use client';

import {
  type IconButtonProps,
  lighten,
  TableBody,
  TableCell,
  type TableCellProps,
  TableHead,
  type TableProps,
  TableRow,
} from '@mui/material';
import React from 'react';
import type {HeaderActionsProps} from '@/components/Card';
import {ErrorAlert, type ErrorAlertProps} from '@/components/ErrorAlert';
import type {SearchInputProps} from '@/components/Form/SearchInput';
import {CircularProgress} from '@/components/Loading';
import {NoResults, type NoResultsProps} from '@/components/NoResults';
import type {PaginationProps} from '@/components/Table/EntityTable/Pagination';
import {TableContainer} from '@/components/Table/TableContainer';

export type BasicTableProps<Entity, EntityKey extends keyof Entity> = {
  isLoading?: boolean;
  data: Entity[];
  dataKey: EntityKey;
  headerCells: (
    | keyof Entity
    | {key: keyof Entity; label: string; align?: TableCellProps['align']}
    | {placeholder: true}
  )[];
  renderHeaderCell?: (cell: keyof Entity, data: Entity[]) => React.ReactNode;
  renderRow: (cell: keyof Entity, item: Entity, data: Entity[]) => React.ReactNode;
  error?: ErrorAlertProps['error'];
  pagination?: PaginationProps;
  slots?: Partial<{
    title: {showCount?: boolean};
    actions: HeaderActionsProps;
    create: IconButtonProps & {enabled: boolean};
    export: IconButtonProps & {enabled: boolean};
    noResults: NoResultsProps;
    error: Omit<ErrorAlertProps, 'error'>;
    search: SearchInputProps & {enabled: boolean};
    table: TableProps;
  }>;
};

export const BasicTable = <E, Key extends keyof E>({
  isLoading = false,
  data,
  dataKey,
  headerCells,
  renderHeaderCell,
  renderRow,
  slots,
  error,
}: BasicTableProps<E, Key>) => {
  const noItemsFoundText = 'No items found';
  const hasError = !!(error && (typeof error === 'object' || (typeof error === 'string' && error.length > 0)));

  return (
    <React.Fragment>
      {!isLoading && !hasError && data.length === 0 && (
        <NoResults text={noItemsFoundText} {...slots?.noResults} sx={{m: 2, ...slots?.noResults?.sx}} />
      )}

      {hasError && <ErrorAlert error={error} {...slots?.error} sx={{m: 2, ...slots?.error?.sx}} />}

      {isLoading && data.length === 0 && <CircularProgress />}

      {data.length > 0 && (
        <TableContainer
          tableProps={{
            stickyHeader: true,
            ...slots?.table,
            sx: {
              tableLayout: 'auto',
              ...slots?.table?.sx,
            },
          }}
        >
          <TableHead>
            <TableRow>
              {headerCells.map(cell => {
                const isBasicKey = typeof cell !== 'object';
                const key = isBasicKey ? cell : 'key' in cell ? cell.key : ''; // it's a placeholder cell and doesn't need a key, but we need to satisfy the type system
                if (renderHeaderCell) {
                  return renderHeaderCell(key as Key, data);
                }
                const label = isBasicKey ? String(cell) : 'label' in cell ? cell.label : '';
                const textAlignment: TableCellProps['align'] = !isBasicKey && 'align' in cell ? cell.align : 'left';
                return (
                  <TableCell
                    key={typeof key === 'string' ? key : key.toString()}
                    sx={{
                      backgroundColor: theme => lighten(theme.palette.background.paper, 0.0825),
                    }}
                    align={textAlignment}
                  >
                    {label}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, _idx, dataList) => {
              const primaryKey = item[dataKey];
              return <TableRow key={primaryKey as React.Key}>{renderRow(dataKey, item, dataList)}</TableRow>;
            })}
          </TableBody>
        </TableContainer>
      )}
    </React.Fragment>
  );
};
