'use client';

import {Box, Paper, type SxProps, type Theme} from '@mui/material';
import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridRowSelectionModel,
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
  pagination?: boolean;
  pageSizeOptions?: number[];
  checkboxSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  editMode?: 'row' | 'cell';
  processRowUpdate?: (newRow: T, oldRow: T) => T | Promise<T>;
  onProcessRowUpdateError?: (error: Error) => void;
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
  pageSizeOptions = [15, 25, 50, 100],
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  editMode,
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
            pagination={pagination === true ? true : undefined}
            pageSizeOptions={pageSizeOptions}
            checkboxSelection={checkboxSelection}
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={onRowSelectionModelChange}
            editMode={editMode}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={onProcessRowUpdateError}
            localeText={{
              noRowsLabel: emptyMessage,
            }}
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
