'use client';

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Stack,
} from '@mui/material';
import type {GridColDef, GridRowId, GridRowSelectionModel, GridValidRowModel} from '@mui/x-data-grid';
import {useCallback, useEffect, useRef, useState} from 'react';
import {CloseIconButton} from '@/components/Button';
import {ErrorAlert} from '@/components/ErrorAlert';
import {ZoomTransition} from '@/components/Transition';
import {DataTable} from '../DataTable';

const MAX_ROWS = 100;

type MappingSuccess<Payload> = {success: true; payload: Payload[]};
type MappingFailure = {
  success: false;
  issues: Array<{rowId: GridRowId; message: string}>;
};

export type BatchEntityDialogProps<Row extends GridValidRowModel & {id: GridRowId}, Payload> = {
  open: boolean;
  title: string;
  mode: 'CREATE' | 'EDIT';
  initialRows: Row[];
  columns: GridColDef<Row>[];
  createEmptyRow: () => Row;
  mapRowsToPayload: (rows: Row[]) => MappingSuccess<Payload> | MappingFailure;
  onSubmit: (payload: Payload[]) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
  error?: string | Error | null;
};

type SelectionModel = GridRowSelectionModel;

const emptySelection = (): SelectionModel => ({type: 'include', ids: new Set<GridRowId>()});

/**
 * Full-screen ALV-style editor for creating or updating a group of entities.
 * Draft rows are intentionally kept local until the user submits the entire grid.
 */
export const BatchEntityDialog = <Row extends GridValidRowModel & {id: GridRowId}, Payload>({
  open,
  title,
  mode,
  initialRows,
  columns,
  createEmptyRow,
  mapRowsToPayload,
  onSubmit,
  onClose,
  isSubmitting = false,
  error = null,
}: BatchEntityDialogProps<Row, Payload>) => {
  const [draftRows, setDraftRows] = useState<Row[]>([]);
  const [selectionModel, setSelectionModel] = useState<SelectionModel>(emptySelection);
  const [validationIssues, setValidationIssues] = useState<MappingFailure['issues']>([]);
  const [draftError, setDraftError] = useState<Error | null>(null);
  const wasOpen = useRef(false);

  const resetState = useCallback(() => {
    setDraftRows([]);
    setSelectionModel(emptySelection());
    setValidationIssues([]);
    setDraftError(null);
  }, []);

  // Snapshot the input rows only when the dialog transitions from closed to open.
  // This prevents parent refreshes/re-renders from overwriting edits in progress.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setDraftRows(mode === 'CREATE' ? [createEmptyRow()] : initialRows.map(row => ({...row})));
      setSelectionModel(emptySelection());
      setValidationIssues([]);
      setDraftError(null);
    } else if (!open && wasOpen.current) {
      resetState();
    }
    wasOpen.current = open;
  }, [createEmptyRow, initialRows, mode, open, resetState]);

  const handleClose = useCallback(() => {
    resetState();
    wasOpen.current = false;
    onClose();
  }, [onClose, resetState]);

  const handleProcessRowUpdate = useCallback((newRow: Row): Row => {
    setDraftRows(rows => rows.map(row => (row.id === newRow.id ? newRow : row)));
    setValidationIssues([]);
    setDraftError(null);
    return newRow;
  }, []);

  const handleProcessRowUpdateError = useCallback((updateError: Error) => {
    setDraftError(updateError);
  }, []);

  const handleAddRow = useCallback(() => {
    setDraftRows(rows => (rows.length >= MAX_ROWS ? rows : [...rows, createEmptyRow()]));
    setValidationIssues([]);
  }, [createEmptyRow]);

  const handleRemoveSelected = useCallback(() => {
    setDraftRows(rows => {
      if (rows.length <= 1) return rows;

      const selected =
        selectionModel.type === 'exclude'
          ? new Set(rows.filter(row => !selectionModel.ids.has(row.id)).map(row => row.id))
          : selectionModel.ids;
      if (selected.size === 0) return rows;

      const remaining = rows.filter(row => !selected.has(row.id));
      return remaining.length === 0 ? [rows[0]] : remaining;
    });
    setSelectionModel(emptySelection());
    setValidationIssues([]);
  }, [selectionModel]);

  const handleSubmit = useCallback(async () => {
    setValidationIssues([]);
    setDraftError(null);

    let result: MappingSuccess<Payload> | MappingFailure;
    try {
      result = mapRowsToPayload(draftRows);
    } catch (submitError) {
      setDraftError(submitError instanceof Error ? submitError : new Error(String(submitError)));
      return;
    }

    if (!result.success) {
      setValidationIssues(result.issues);
      return;
    }

    try {
      await onSubmit(result.payload);
      if (wasOpen.current) handleClose();
    } catch (submitError) {
      setDraftError(submitError instanceof Error ? submitError : new Error(String(submitError)));
    }
  }, [draftRows, handleClose, mapRowsToPayload, onSubmit]);

  const selectedRowIds =
    selectionModel.type === 'exclude'
      ? new Set(draftRows.filter(row => !selectionModel.ids.has(row.id)).map(row => row.id))
      : selectionModel.ids;
  const externalError = error ?? draftError;

  return (
    <Dialog
      fullScreen
      fullWidth
      open={open}
      onClose={handleClose}
      scroll="paper"
      slots={{transition: ZoomTransition}}
      slotProps={{paper: {elevation: 0}}}
    >
      <DialogTitle>{title}</DialogTitle>
      <CloseIconButton
        onClick={handleClose}
        sx={theme => ({
          position: 'absolute',
          top: theme.spacing(1),
          right: theme.spacing(1),
        })}
      />

      <DialogContent
        dividers
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          gap: 1,
        }}
      >
        {validationIssues.length > 0 && (
          <Alert severity="error" role="alert">
            <AlertTitle>Validation errors</AlertTitle>
            <List dense disablePadding>
              {validationIssues.map((issue, index) => {
                const rowIndex = draftRows.findIndex(row => row.id === issue.rowId);
                return (
                  <ListItem key={`${String(issue.rowId)}-${index}`} disableGutters>
                    Row {rowIndex >= 0 ? rowIndex + 1 : String(issue.rowId)}: {issue.message}
                  </ListItem>
                );
              })}
            </List>
          </Alert>
        )}
        {externalError && <ErrorAlert error={externalError} role="alert" />}
        <Box sx={{flex: 1, minHeight: 0}}>
          <DataTable
            data={draftRows}
            columns={columns}
            pagination={false}
            checkboxSelection
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={setSelectionModel}
            editMode="cell"
            processRowUpdate={handleProcessRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}
            height="100%"
            sx={{height: '100%'}}
            dataGridProps={{
              sx: {height: '100%'},
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{justifyContent: 'space-between', gap: 1, flexWrap: 'wrap'}}>
        <Stack direction="row" gap={1}>
          {mode === 'CREATE' && (
            <>
              <Button onClick={handleAddRow} disabled={isSubmitting || draftRows.length >= MAX_ROWS}>
                Add row
              </Button>
              <Button onClick={handleRemoveSelected} disabled={isSubmitting || selectedRowIds.size === 0}>
                Remove selected
              </Button>
            </>
          )}
        </Stack>
        <Stack direction="row" gap={1}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            Save
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
