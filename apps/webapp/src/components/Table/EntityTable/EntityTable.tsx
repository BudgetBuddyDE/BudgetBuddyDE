'use client';

import {ClearRounded, DeleteRounded} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  lighten,
  Paper,
  Stack,
  type SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  type Theme,
  Typography,
} from '@mui/material';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {ErrorAlert} from '@/components/ErrorAlert';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import type {BasicTableProps, ColumnDefinition} from '@/components/Table';
import {Pagination, type PaginationProps} from '../Pagination';
import {TableToolbar, type TableToolbarProps} from '../TableToolbar';
import {getNestedValue} from '../utils';

export type EntitySlice<T> = {
  data: T[];
  isLoading: boolean;
  error: string | Error | null;
  totalCount?: number;
};

export type SelectionAction<T> = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: (selectedEntities: T[]) => void;
};

export type EntityTableProps<T, K extends keyof T = keyof T> = {
  slice: EntitySlice<T>;
  dataKey: K;
  columns: ColumnDefinition<T>[];
  toolbar?: TableToolbarProps & {
    showCount?: boolean;
  };
  pagination?: Omit<PaginationProps, 'count'>;
  emptyMessage?: string;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  rowHeight?: number;
  sx?: SxProps<Theme>;
  onRowClick?: BasicTableProps<T, K>['onRowClick'];
  renderRow?: BasicTableProps<T, K>['renderRow'];
  // Selection
  withSelection?: boolean;
  onDeleteSelectedEntities?: (selectedIds: T[K][]) => void;
  selectionActions?: SelectionAction<T>[];
};

export const EntityTable = <T, K extends keyof T = keyof T>({
  slice,
  dataKey,
  columns,
  toolbar,
  pagination,
  emptyMessage = 'No items found',
  stickyHeader = true,
  maxHeight,
  rowHeight,
  sx,
  onRowClick,
  renderRow,
  withSelection = false,
  onDeleteSelectedEntities,
  selectionActions = [],
}: EntityTableProps<T, K>) => {
  const {data, isLoading, error, totalCount} = slice;
  const hasError = !!(error && (typeof error === 'object' || (typeof error === 'string' && error.length > 0)));
  const errorMessage = error instanceof Error ? error.message : error;
  const displayCount = totalCount ?? data.length;

  const [selectedIds, setSelectedIds] = React.useState<Set<T[K]>>(new Set());

  const toolbarTitle = toolbar?.showCount && toolbar.title ? `${toolbar.title} (${displayCount})` : toolbar?.title;

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(data.map(row => row[dataKey])));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: T[K]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < data.length;
  const selectedEntities = data.filter(row => selectedIds.has(row[dataKey]));

  // Clear selection when data changes - data length change is a proxy for data changing
  const dataLength = data.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to clear selection when data changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [dataLength]);

  const defaultRenderRow = (row: T, index: number) => (
    <TableRow
      key={String(row[dataKey])}
      hover={!!onRowClick}
      onClick={() => onRowClick?.(row, index)}
      sx={{cursor: onRowClick ? 'pointer' : 'default', height: rowHeight}}
      selected={withSelection && selectedIds.has(row[dataKey])}
    >
      {withSelection && (
        <TableCell padding="checkbox">
          <Checkbox
            checked={selectedIds.has(row[dataKey])}
            onChange={() => handleSelectRow(row[dataKey])}
            onClick={e => e.stopPropagation()}
          />
        </TableCell>
      )}
      {columns.map(col => {
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
      {toolbar && <TableToolbar {...toolbar} title={toolbarTitle} isLoading={isLoading && data.length === 0} />}

      {withSelection && selectedIds.size > 0 && (
        <Box
          sx={theme => ({
            px: 2,
            py: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" fontWeight={'bolder'}>
              {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
            </Typography>
            <Stack direction="row" gap={1}>
              <Button
                size="small"
                onClick={() => setSelectedIds(new Set())}
                startIcon={<ClearRounded fontSize={'small'} />}
              >
                Clear selection
              </Button>
              {selectionActions.map((action, idx) => (
                <Button
                  key={`${action.label?.toString().toLowerCase().replaceAll(' ', '_')}-${idx}`}
                  size={'small'}
                  startIcon={action.icon}
                  onClick={() => {
                    action.onClick(selectedEntities);
                  }}
                >
                  {action.label}
                </Button>
              ))}
              {onDeleteSelectedEntities && (
                <Button
                  size={'small'}
                  variant={'contained'}
                  color={'error'}
                  startIcon={<DeleteRounded fontSize={'small'} />}
                  onClick={() => {
                    onDeleteSelectedEntities(Array.from(selectedIds));
                  }}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      )}

      <Box sx={{px: 0}}>
        {!isLoading && !hasError && data.length === 0 && <NoResults text={emptyMessage} sx={{m: 2}} />}

        {hasError && <ErrorAlert error={errorMessage} sx={{m: 2}} />}

        {isLoading && data.length === 0 && <CircularProgress />}

        {data.length > 0 && (
          <TableContainer sx={{maxHeight}}>
            <Table stickyHeader={stickyHeader} sx={{tableLayout: 'auto'}}>
              <TableHead>
                <TableRow>
                  {withSelection && (
                    <TableCell
                      padding="checkbox"
                      sx={{backgroundColor: theme => lighten(theme.palette.background.paper, 0.0825)}}
                    >
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isPartiallySelected}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
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
                {data.map((row, index) => (renderRow ? renderRow(row, index, columns) : defaultRenderRow(row, index)))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {pagination && (
        <Box sx={{px: 2, pb: 2}}>
          <ActionPaper sx={{width: 'fit-content', ml: 'auto', mt: 2}}>
            <Pagination
              count={displayCount}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              rowsPerPageOptions={pagination.rowsPerPageOptions}
              onPageChange={pagination.onPageChange}
              onRowsPerPageChange={pagination.onRowsPerPageChange}
            />
          </ActionPaper>
        </Box>
      )}
    </Paper>
  );
};
