'use client';

import {Box, Paper, type SxProps, type Theme} from '@mui/material';
import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowModesModel,
  type GridRowSelectionModel,
  type GridSortModel,
  type GridValidRowModel,
} from '@mui/x-data-grid';
import {ErrorAlert} from '@/components/ErrorAlert';
import {TableToolbar, type TableToolbarProps} from '../TableToolbar';

export type DataTableColumn<T extends GridValidRowModel> = GridColDef<T>;

export type DataTableProps<T extends GridValidRowModel & {id: string | number}> = {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  error?: string | Error | null;
  emptyMessage?: string;
  toolbar?: TableToolbarProps;
  // Pagination
  pagination?: boolean;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
  rowCount?: number;
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
  dataGridProps?: Partial<DataGridProps<T>>;
};

export const DataTable = <T extends GridValidRowModel & {id: string | number}>({
  data,
  columns,
  isLoading = false,
  error,
  emptyMessage = 'No items found',
  toolbar,
  pagination = true,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10, 25, 50, 100],
  rowCount,
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
}: DataTableProps<T>) => {
  const hasError = !!(error && (typeof error === 'object' || (typeof error === 'string' && error.length > 0)));
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Paper elevation={3} sx={{borderRadius: 2, boxShadow: 'unset', overflow: 'hidden', ...sx}}>
      {toolbar && <TableToolbar {...toolbar} isLoading={isLoading && data.length === 0} />}

      {hasError && <ErrorAlert error={errorMessage} sx={{m: 2}} />}

      {!hasError && (
        <Box sx={{height: autoHeight ? 'auto' : height, width: '100%'}}>
          <DataGrid
            rows={data}
            columns={columns}
            loading={isLoading}
            density={density}
            autoHeight={autoHeight}
            disableRowSelectionOnClick
            // Pagination
            pagination={pagination === true ? true : undefined}
            paginationModel={paginationModel}
            onPaginationModelChange={onPaginationModelChange}
            pageSizeOptions={pageSizeOptions}
            rowCount={rowCount}
            paginationMode={paginationMode}
            // Sorting
            sortModel={sortModel}
            onSortModelChange={onSortModelChange}
            sortingMode={sortingMode}
            // Filtering
            filterModel={filterModel}
            onFilterModelChange={onFilterModelChange}
            filterMode={filterMode}
            // Selection
            checkboxSelection={checkboxSelection}
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={onRowSelectionModelChange}
            // Inline Editing
            editMode={editMode}
            rowModesModel={rowModesModel}
            onRowModesModelChange={onRowModesModelChange}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={onProcessRowUpdateError}
            // Localization
            localeText={{
              noRowsLabel: emptyMessage,
            }}
            // Styling
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'background.paper',
              },
            }}
            {...dataGridProps}
          />
        </Box>
      )}
    </Paper>
  );
};
