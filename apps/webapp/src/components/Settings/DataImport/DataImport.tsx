'use client';

import type {
  TApplicationImportPreviewRecord,
  TApplicationImportRecord,
  TApplicationImportResult,
} from '@budgetbuddyde/api/applicationImport';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {CloseIconButton, FullscreenIconButton} from '@/components/Button';
import {Card} from '@/components/Card';
import {DismissableAlert} from '@/components/DismissableAlert';
import {useSnackbarContext} from '@/components/Snackbar';
import {budgetSlice} from '@/lib/features/budgets/budgetSlice';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {paymentMethodSlice} from '@/lib/features/paymentMethods/paymentMethodSlice';
import {recurringPaymentSlice} from '@/lib/features/recurringPayments/recurringPaymentSlice';
import {transactionSlice} from '@/lib/features/transactions/transactionSlice';
import {useAppDispatch} from '@/lib/hooks';

const steps = ['Upload file', 'Preview files', 'Successful imports', 'Failed imports', 'Finish'];

const resourceLabels = {
  categories: 'Categories',
  'payment-methods': 'Payment methods',
  transactions: 'Transactions',
  'recurring-payments': 'Recurring payments',
  budgets: 'Budgets',
} as const;

type TResource = keyof typeof resourceLabels;
type TTableRow = {preview: TApplicationImportPreviewRecord; record?: TApplicationImportRecord; status?: string};

function labelForField(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
}

function displayValue(value: boolean | number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function resultRows(
  result: TApplicationImportResult,
  resource: TResource,
  records: TApplicationImportRecord[],
  status: string,
): TTableRow[] {
  const previewByRow = new Map(result.preview[resource].map(record => [record.row, record]));
  return records.map(record => ({
    preview: previewByRow.get(record.row) ?? {data: {}, row: record.row, sourceId: record.sourceId},
    record,
    status,
  }));
}

function ResourceTable({resource, rows, title}: {resource: TResource; rows: TTableRow[]; title: string}) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row.preview.data))));
  const hasStatus = rows.some(row => row.status);
  const hasReason = rows.some(row => row.record?.message);
  const visibleRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  React.useEffect(() => {
    if (page * rowsPerPage >= rows.length && page > 0) setPage(0);
  }, [page, rows.length, rowsPerPage]);

  if (rows.length === 0) return null;

  return (
    <Stack spacing={1}>
      <TableContainer component={Paper} variant="outlined">
        <Table stickyHeader size="small" aria-label={`${title} ${resourceLabels[resource]}`}>
          <TableHead>
            <TableRow>
              <TableCell>Archive line</TableCell>
              {columns.map(column => (
                <TableCell key={column}>{labelForField(column)}</TableCell>
              ))}
              {hasStatus && <TableCell>Status</TableCell>}
              {hasReason && <TableCell>Reason</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map(row => (
              <TableRow key={`${row.preview.row}-${row.preview.sourceId ?? ''}-${row.status ?? 'preview'}`}>
                <TableCell>{row.preview.row}</TableCell>
                {columns.map(column => (
                  <TableCell
                    key={column}
                    sx={{maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}
                  >
                    {displayValue(row.preview.data[column])}
                  </TableCell>
                ))}
                {hasStatus && <TableCell>{row.status}</TableCell>}
                {hasReason && <TableCell>{row.record?.message ?? '-'}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={event => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
      />
    </Stack>
  );
}

function ResourceTabs({
  title,
  rowsForResource,
}: {
  title: string;
  rowsForResource: (resource: TResource) => TTableRow[];
}) {
  const resources = (Object.keys(resourceLabels) as TResource[]).filter(
    resource => rowsForResource(resource).length > 0,
  );
  const [selectedResource, setSelectedResource] = React.useState<TResource>(resources[0] ?? 'categories');
  const activeResource = resources.includes(selectedResource) ? selectedResource : resources[0];

  if (!activeResource) return <Typography>No records found in this archive.</Typography>;

  return (
    <Stack spacing={2}>
      <Tabs
        value={activeResource}
        onChange={(_event, resource: TResource) => setSelectedResource(resource)}
        aria-label={`${title} resource tabs`}
        variant="scrollable"
        scrollButtons="auto"
      >
        {resources.map(resource => (
          <Tab
            key={resource}
            value={resource}
            label={`${resourceLabels[resource]} (${rowsForResource(resource).length})`}
          />
        ))}
      </Tabs>
      <ResourceTable resource={activeResource} rows={rowsForResource(activeResource)} title={title} />
    </Stack>
  );
}

export type DataImportProps = {
  asButton?: boolean;
};

export const DataImport: React.FC<DataImportProps> = ({asButton}) => {
  const dispatch = useAppDispatch();
  const {showSnackbar} = useSnackbarContext();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<TApplicationImportResult | null>(null);
  const [activeStep, setActiveStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreenActive(prev => !prev);
  };

  const refreshEntities = () => {
    dispatch(categorySlice.actions.refresh());
    dispatch(paymentMethodSlice.actions.refresh());
    dispatch(transactionSlice.actions.refresh());
    dispatch(recurringPaymentSlice.actions.refresh());
    dispatch(budgetSlice.actions.refresh());
  };

  const submit = async (mode: 'preview' | 'commit') => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const [data, error] = await apiClient.backend.application.importArchive(file, mode);
      if (error) throw error;
      setResult(data);
      setActiveStep(mode === 'preview' ? 1 : 2);
      if (mode === 'commit') {
        refreshEntities();
        showSnackbar({message: 'Import completed.'});
      }
    } catch (error) {
      showSnackbar({message: error instanceof Error ? error.message : 'The archive could not be imported.'});
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    if (isSubmitting) return;
    setOpen(false);
    setFile(null);
    setResult(null);
    setActiveStep(0);
  };

  const previewRows = (resource: TResource): TTableRow[] => result?.preview[resource].map(preview => ({preview})) ?? [];
  const successfulRows = (resource: TResource): TTableRow[] => {
    if (!result) return [];
    return [
      ...resultRows(result, resource, result.resources[resource].created, 'Imported'),
      ...resultRows(result, resource, result.resources[resource].skipped, 'Skipped'),
    ];
  };
  const failedRows = (resource: TResource): TTableRow[] =>
    result ? resultRows(result, resource, result.resources[resource].failed, 'Failed') : [];

  const stepContent = () => {
    if (activeStep === 0) {
      return (
        <Stack spacing={3}>
          <DismissableAlert severity="info">
            Select a ZIP archive created by Application data export. Auth data and attachments are not imported.
          </DismissableAlert>
          <Button component="label" variant="outlined" startIcon={<FileUploadOutlined />} disabled={isSubmitting}>
            Choose export archive
            <input
              hidden
              type="file"
              accept="application/zip,.zip"
              onChange={event => {
                setFile(event.target.files?.[0] ?? null);
                setResult(null);
              }}
            />
          </Button>
          {file && <Typography variant="body2">Selected: {file.name}</Typography>}
        </Stack>
      );
    }
    if (!result) return null;
    if (activeStep === 1) {
      return (
        <Stack spacing={3}>
          <DismissableAlert severity={result.summary.failed > 0 ? 'warning' : 'success'}>
            {result.summary.received} records found. {result.summary.created} are ready to import and{' '}
            {result.summary.failed} have validation or reference errors.
          </DismissableAlert>
          <ResourceTabs key="preview" title="Preview" rowsForResource={previewRows} />
        </Stack>
      );
    }
    if (activeStep === 2) {
      return (
        <Stack spacing={3}>
          <DismissableAlert severity="success">
            Imported: {result.summary.created}, skipped because they already exist: {result.summary.skipped}.
          </DismissableAlert>
          <ResourceTabs key="successful-imports" title="Successful imports" rowsForResource={successfulRows} />
        </Stack>
      );
    }
    if (activeStep === 3) {
      return (
        <Stack spacing={3}>
          <DismissableAlert severity={result.summary.failed > 0 ? 'warning' : 'success'}>
            Failed imports: {result.summary.failed}.
          </DismissableAlert>
          {result.summary.failed > 0 ? (
            <ResourceTabs key="failed-imports" title="Failed imports" rowsForResource={failedRows} />
          ) : (
            <Typography>No imports failed.</Typography>
          )}
        </Stack>
      );
    }
    return (
      <Stack spacing={2}>
        <DismissableAlert severity={result.summary.failed > 0 ? 'warning' : 'success'}>
          Import finished. Imported: {result.summary.created}, skipped: {result.summary.skipped}, failed:{' '}
          {result.summary.failed}.
        </DismissableAlert>
        <Typography>Review failed records before retrying with a corrected export archive.</Typography>
      </Stack>
    );
  };

  const primaryAction = () => {
    if (activeStep === 0)
      return {disabled: !file || isSubmitting, label: 'Preview files', onClick: () => submit('preview')};
    if (activeStep === 1) {
      if (!result || result.summary.created === 0) {
        const hasFailures = Boolean(result?.summary.failed);
        return {
          disabled: false,
          label: hasFailures ? 'Show failed imports' : 'Show import results',
          onClick: () => setActiveStep(hasFailures ? 3 : 2),
        };
      }
      return {
        disabled: isSubmitting,
        label: `Import ${result.summary.created} records`,
        onClick: () => submit('commit'),
      };
    }
    if (activeStep === 2) return {disabled: false, label: 'Show failed imports', onClick: () => setActiveStep(3)};
    if (activeStep === 3) return {disabled: false, label: 'Finish', onClick: () => setActiveStep(4)};
    return {disabled: false, label: 'Close', onClick: close};
  };
  const action = primaryAction();

  return (
    <React.Fragment>
      {asButton ? (
        <Button variant="contained" startIcon={<FileUploadOutlined />} onClick={() => setOpen(true)}>
          Import data
        </Button>
      ) : (
        <Card>
          <Card.Header>
            <Stack>
              <Card.Title>Import data</Card.Title>
              <Card.Subtitle>Restore application data from a BudgetBuddy export archive</Card.Subtitle>
            </Stack>
          </Card.Header>
          <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button variant="contained" startIcon={<FileUploadOutlined />} onClick={() => setOpen(true)}>
              Import data
            </Button>
          </Card.Footer>
        </Card>
      )}

      <Dialog
        open={open}
        onClose={close}
        fullScreen={isFullscreenActive}
        fullWidth
        maxWidth="xl"
        slotProps={{paper: {elevation: 0}}}
      >
        <DialogTitle>Import data</DialogTitle>
        <Box sx={theme => ({position: 'absolute', top: theme.spacing(1), right: theme.spacing(1)})}>
          <FullscreenIconButton onClick={toggleFullscreen} isFullscreen={isFullscreenActive} />
          <CloseIconButton onClick={close} />
        </Box>
        <DialogContent>
          <Stack spacing={3}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map(step => (
                <Step key={step}>
                  <StepLabel>{step}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box>{stepContent()}</Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isSubmitting} onClick={close}>
            Cancel
          </Button>
          {activeStep > 0 && activeStep < 2 && (
            <Button disabled={isSubmitting} onClick={() => setActiveStep(activeStep - 1)}>
              Back
            </Button>
          )}
          <Button
            variant="contained"
            disabled={action.disabled}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};
