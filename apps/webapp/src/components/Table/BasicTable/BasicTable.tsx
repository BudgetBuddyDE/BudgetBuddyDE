'use client';

import {
  Box,
  lighten,
  Paper,
  type SxProps,
  Table,
  TableBody,
  TableCell,
  type TableCellProps,
  TableContainer,
  TableHead,
  type TableProps,
  TableRow,
  type Theme,
  Typography,
} from '@mui/material';
import type React from 'react';
import {ErrorAlert} from '@/components/ErrorAlert';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {TableToolbar, type TableToolbarProps} from '../TableToolbar';
import {getNestedValue} from '../utils';

export type ColumnDefinition<T> = {
  key: keyof T | string;
  label: string;
  align?: TableCellProps['align'];
  width?: string | number;
  renderCell?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
};

export type BasicTableProps<T, K extends keyof T = keyof T> = {
  data: T[];
  dataKey: K;
  columns: ColumnDefinition<T>[];
  isLoading?: boolean;
  error?: string | Error | null;
  emptyMessage?: string;
  toolbar?: TableToolbarProps;
  tableProps?: TableProps;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  sx?: SxProps<Theme>;
  onRowClick?: (row: T, index: number) => void;
  renderRow?: (row: T, index: number, columns: ColumnDefinition<T>[]) => React.ReactNode;
};

export const BasicTable = <T, K extends keyof T = keyof T>({
  data,
  dataKey,
  columns,
  isLoading = false,
  error,
  emptyMessage = 'No items found',
  toolbar,
  tableProps,
  stickyHeader = true,
  maxHeight,
  sx,
  onRowClick,
  renderRow,
}: BasicTableProps<T, K>) => {
  const hasError = !!(error && (typeof error === 'object' || (typeof error === 'string' && error.length > 0)));
  const errorMessage = error instanceof Error ? error.message : error;

  const defaultRenderRow = (row: T, index: number, cols: ColumnDefinition<T>[]) => (
    <TableRow
      key={String(row[dataKey])}
      hover={!!onRowClick}
      onClick={() => onRowClick?.(row, index)}
      sx={{cursor: onRowClick ? 'pointer' : 'default'}}
    >
      {cols.map(col => {
        const value = getNestedValue(row, String(col.key));
        return (
          <TableCell key={String(col.key)} align={col.align ?? 'left'} sx={{width: col.width}}>
            {col.renderCell ? col.renderCell(value as T[keyof T], row, index) : String(value ?? '')}
          </TableCell>
        );
      })}
    </TableRow>
  );

  return (
    <Paper elevation={3} sx={{borderRadius: 2, boxShadow: 'unset', overflow: 'hidden', ...sx}}>
      {toolbar && <TableToolbar {...toolbar} isLoading={isLoading && data.length === 0} />}

      <Box sx={{px: 0}}>
        {!isLoading && !hasError && data.length === 0 && <NoResults text={emptyMessage} sx={{m: 2}} />}

        {hasError && <ErrorAlert error={errorMessage} sx={{m: 2}} />}

        {isLoading && data.length === 0 && <CircularProgress />}

        {data.length > 0 && (
          <TableContainer sx={{maxHeight}}>
            <Table stickyHeader={stickyHeader} {...tableProps} sx={{tableLayout: 'auto', ...tableProps?.sx}}>
              <TableHead>
                <TableRow>
                  {columns.map(col => (
                    <TableCell
                      key={String(col.key)}
                      align={col.align ?? 'left'}
                      sx={{
                        backgroundColor: theme => lighten(theme.palette.background.paper, 0.0825),
                        width: col.width,
                      }}
                    >
                      {col.renderHeader ? (
                        col.renderHeader()
                      ) : (
                        <Typography variant="body1" fontWeight="bolder">
                          {col.label}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) =>
                  renderRow ? renderRow(row, index, columns) : defaultRenderRow(row, index, columns),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
};
