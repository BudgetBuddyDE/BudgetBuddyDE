'use client';

import type {SxProps, Theme} from '@mui/material';
import type {
  GridFilterModel,
  GridPaginationModel,
  GridRowModesModel,
  GridRowSelectionModel,
  GridSortModel,
  GridValidRowModel,
} from '@mui/x-data-grid';
import {DataTable, type DataTableColumn, type DataTableProps} from '../DataTable';
import type {EntitySlice} from '../EntityTable';
import type {TableToolbarProps} from '../TableToolbar';

export type EntityDataTableProps<T extends GridValidRowModel & {id: string | number}> = {
  slice: EntitySlice<T>;
  columns: DataTableColumn<T>[];
  toolbar?: TableToolbarProps & {
    showCount?: boolean;
  };
  emptyMessage?: string;
  // Pagination
  pagination?: boolean;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
  paginationMode?: 'client' | 'server';
  // Sorting
  sortModel?: GridSortModel;
  onSortModelChange?: (model: GridSortModel) => void;
  sortingMode?: 'client' | 'server';
  // Filtering
  filterModel?: GridFilterModel;
  onFilterModelChange?: (model: GridFilterModel) => void;
  filterMode?: 'client' | 'server';
  // Selection
  checkboxSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  // Inline Editing
  editMode?: 'row' | 'cell';
  rowModesModel?: GridRowModesModel;
  onRowModesModelChange?: (model: GridRowModesModel) => void;
  processRowUpdate?: (newRow: T, oldRow: T) => T | Promise<T>;
  onProcessRowUpdateError?: (error: Error) => void;
  // Styling
  height?: number | string;
  autoHeight?: boolean;
  density?: 'compact' | 'standard' | 'comfortable';
  sx?: SxProps<Theme>;
  // Pass-through props
  dataGridProps?: DataTableProps<T>['dataGridProps'];
};

export const EntityDataTable = <T extends GridValidRowModel & {id: string | number}>({
  slice,
  columns,
  toolbar,
  emptyMessage = 'No items found',
  pagination = true,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10, 25, 50, 100],
  paginationMode = 'client',
  sortModel,
  onSortModelChange,
  sortingMode = 'client',
  filterModel,
  onFilterModelChange,
  filterMode = 'client',
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  editMode,
  rowModesModel,
  onRowModesModelChange,
  processRowUpdate,
  onProcessRowUpdateError,
  height = 400,
  autoHeight = false,
  density = 'standard',
  sx,
  dataGridProps,
}: EntityDataTableProps<T>) => {
  const {data, isLoading, error, totalCount} = slice;
  const displayCount = totalCount ?? data.length;

  const toolbarWithCount = toolbar
    ? {
        ...toolbar,
        title: toolbar.showCount && toolbar.title ? `${toolbar.title} (${displayCount})` : toolbar.title,
      }
    : undefined;

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      emptyMessage={emptyMessage}
      toolbar={toolbarWithCount}
      pagination={pagination}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={pageSizeOptions}
      rowCount={paginationMode === 'server' ? displayCount : undefined}
      paginationMode={paginationMode}
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      sortingMode={sortingMode}
      filterModel={filterModel}
      onFilterModelChange={onFilterModelChange}
      filterMode={filterMode}
      checkboxSelection={checkboxSelection}
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={onRowSelectionModelChange}
      editMode={editMode}
      rowModesModel={rowModesModel}
      onRowModesModelChange={onRowModesModelChange}
      processRowUpdate={processRowUpdate}
      onProcessRowUpdateError={onProcessRowUpdateError}
      height={height}
      autoHeight={autoHeight}
      density={density}
      sx={sx}
      dataGridProps={dataGridProps}
    />
  );
};
