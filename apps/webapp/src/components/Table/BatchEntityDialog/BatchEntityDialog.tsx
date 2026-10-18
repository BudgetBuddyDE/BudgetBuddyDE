'use client';

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  Stack,
} from '@mui/material';
import {
  GridEditInputCell,
  useGridApiRef,
  type GridColDef,
  type GridRowId,
  type GridRowSelectionModel,
  type GridValidRowModel,
} from '@mui/x-data-grid';
import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react';
import {CloseIconButton} from '@/components/Button/CloseIconButton';
import {ErrorAlert} from '@/components/ErrorAlert';
import {ZoomTransition} from '@/components/Transition';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {DataTable} from '../DataTable';
import {cloneDraftValue, draftRowsEqual} from './draftRows';

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
  const t = useAppTranslations();
  const [draftRows, setDraftRows] = useState<Row[]>([]);
  const [selectionModel, setSelectionModel] = useState<SelectionModel>(emptySelection);
  const [validationIssues, setValidationIssues] = useState<MappingFailure['issues']>([]);
  const [draftError, setDraftError] = useState<Error | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const baselineRows = useRef<Row[]>([]);
  const activeCell = useRef<{id: GridRowId; field: string} | null>(null);
  const confirmingDiscard = useRef(false);
  const apiRef = useGridApiRef();
  const confirmationTitleId = useId();
  const confirmationDescriptionId = useId();
  const wasOpen = useRef(false);
  // Default text/number editors debounce for 200ms. Keep the grid's edit state
  // current so an immediate Escape also protects the last keystroke.
  const editingColumns = useMemo(
    () =>
      columns.map((column): GridColDef<Row> =>
        !column.renderEditCell && (!column.type || column.type === 'string' || column.type === 'number')
          ? {...column, renderEditCell: params => <GridEditInputCell {...params} debounceMs={0} />}
          : column,
      ),
    [columns],
  );

  const resetState = useCallback(() => {
    setDraftRows([]);
    setSelectionModel(emptySelection());
    setValidationIssues([]);
    setDraftError(null);
    baselineRows.current = [];
    activeCell.current = null;
    confirmingDiscard.current = false;
    setConfirmDiscard(false);
  }, []);

  // Snapshot the input rows only when the dialog transitions from closed to open.
  // This prevents parent refreshes/re-renders from overwriting edits in progress.
  useEffect(() => {
    if (!open) {
      resetState();
      wasOpen.current = false;
      return;
    }

    if (!wasOpen.current) {
      const rows = mode === 'CREATE' ? [createEmptyRow()] : cloneDraftValue(initialRows);
      baselineRows.current = cloneDraftValue(rows);
      setDraftRows(rows);
      activeCell.current = null;
      confirmingDiscard.current = false;
      setConfirmDiscard(false);
      setSelectionModel(emptySelection());
      setValidationIssues([]);
      setDraftError(null);
    }
    wasOpen.current = true;
  }, [createEmptyRow, initialRows, mode, open, resetState]);

  const handleClose = useCallback(() => {
    resetState();
    wasOpen.current = false;
    onClose();
  }, [onClose, resetState]);

  const getCurrentRows = useCallback(() => {
    const editingCell = activeCell.current;
    const gridApi = apiRef.current;
    return editingCell && gridApi
      ? draftRows.map(row =>
          row.id === editingCell.id ? (gridApi.getRowWithUpdatedValues(editingCell.id, editingCell.field) as Row) : row,
        )
      : draftRows;
  }, [apiRef, draftRows]);

  const handleRequestClose = useCallback(() => {
    if (isSubmitting || confirmingDiscard.current) return;

    if (draftRowsEqual(getCurrentRows(), baselineRows.current)) {
      handleClose();
    } else {
      confirmingDiscard.current = true;
      setConfirmDiscard(true);
    }
  }, [getCurrentRows, handleClose, isSubmitting]);

  const handleDiscard = useCallback(() => {
    if (isSubmitting) return;

    handleClose();
  }, [handleClose, isSubmitting]);

  const handleKeepEditing = useCallback(() => {
    confirmingDiscard.current = false;
    setConfirmDiscard(false);
  }, []);

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
      result = mapRowsToPayload(getCurrentRows());
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
  }, [getCurrentRows, handleClose, mapRowsToPayload, onSubmit]);

  const selectedRowIds =
    selectionModel.type === 'exclude'
      ? new Set(draftRows.filter(row => !selectionModel.ids.has(row.id)).map(row => row.id))
      : selectionModel.ids;
  const externalError = error ?? draftError;

  return (
    <>
      <Dialog
        fullScreen
        fullWidth
        open={open}
        onClose={handleRequestClose}
        onKeyDownCapture={event => {
          if (event.key === 'Escape') {
            // Intercept before the grid can discard the active cell's input.
            event.preventDefault();
            event.stopPropagation();
            handleRequestClose();
          }
        }}
        scroll="paper"
        slots={{transition: ZoomTransition}}
        slotProps={{paper: {elevation: 0}}}
      >
        <DialogTitle>{title}</DialogTitle>
        <CloseIconButton
          onClick={handleRequestClose}
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
              <AlertTitle>{t('Validation errors')}</AlertTitle>
              <List dense disablePadding>
                {validationIssues.map((issue, index) => {
                  const rowIndex = draftRows.findIndex(row => row.id === issue.rowId);
                  return (
                    <ListItem key={`${String(issue.rowId)}-${index}`} disableGutters>
                      {t('Row {row}: {message}', {
                        row: rowIndex >= 0 ? rowIndex + 1 : String(issue.rowId),
                        message: issue.message,
                      })}
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
              columns={editingColumns}
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
                apiRef,
                onCellEditStart: params => {
                  activeCell.current = {id: params.id, field: params.field};
                },
                onCellEditStop: (params, event) => {
                  if (confirmingDiscard.current && params.reason === 'cellFocusOut') {
                    event.defaultMuiPrevented = true;
                    return;
                  }
                  activeCell.current = null;
                },
                sx: {height: '100%'},
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{justifyContent: 'space-between', gap: 1, flexWrap: 'wrap'}}>
          <Stack direction="row" spacing={1}>
            {mode === 'CREATE' && (
              <>
                <Button onClick={handleAddRow} disabled={isSubmitting || draftRows.length >= MAX_ROWS}>
                  {t('Add row')}
                </Button>
                <Button onClick={handleRemoveSelected} disabled={isSubmitting || selectedRowIds.size === 0}>
                  {t('Remove selected')}
                </Button>
              </>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button onClick={handleRequestClose}>{t('Cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
              {t('Save')}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
      <Dialog
        open={open && confirmDiscard}
        onClose={handleKeepEditing}
        aria-labelledby={confirmationTitleId}
        aria-describedby={confirmationDescriptionId}
        maxWidth="xs"
        fullWidth
        slotProps={{paper: {elevation: 0}}}
      >
        <DialogTitle id={confirmationTitleId}>{t('Discard unsaved changes?')}</DialogTitle>
        <DialogContent>
          <DialogContentText id={confirmationDescriptionId}>
            {t('Your unsaved changes will be lost. Do you want to discard them?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleKeepEditing} autoFocus>
            {t('Keep editing')}
          </Button>
          <Button onClick={handleDiscard} disabled={isSubmitting} color="error" variant="contained">
            {t('Discard changes')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
