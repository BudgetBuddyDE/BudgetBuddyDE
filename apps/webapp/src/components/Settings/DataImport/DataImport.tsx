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
import {useTranslations} from 'next-intl';
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

const resourceKeys = ['categories', 'payment-methods', 'transactions', 'recurring-payments', 'budgets'] as const;
type TResource = (typeof resourceKeys)[number];
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

function ResourceTable({
  resource,
  rows,
  title,
  t,
}: {
  resource: TResource;
  rows: TTableRow[];
  title: string;
  t: ReturnType<typeof useTranslations<'DataImport'>>;
}) {
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
        <Table stickyHeader size="small" aria-label={`${title} ${t(`resources.${resource}`)}`}>
          <TableHead>
            <TableRow>
              <TableCell>{t('archiveLine')}</TableCell>
              {columns.map(column => (
                <TableCell key={column}>{labelForField(column)}</TableCell>
              ))}
              {hasStatus && <TableCell>{t('status')}</TableCell>}
              {hasReason && <TableCell>{t('reason')}</TableCell>}
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
  t,
}: {
  title: string;
  rowsForResource: (resource: TResource) => TTableRow[];
  t: ReturnType<typeof useTranslations<'DataImport'>>;
}) {
  const availableResources = (resourceKeys as readonly TResource[]).filter(
    resource => rowsForResource(resource).length > 0,
  );
  const [selectedResource, setSelectedResource] = React.useState<TResource>(availableResources[0] ?? 'categories');
  const activeResource = availableResources.includes(selectedResource) ? selectedResource : availableResources[0];

  if (!activeResource) return <Typography>{t('noRecords')}</Typography>;

  return (
    <Stack spacing={2}>
      <Tabs
        value={activeResource}
        onChange={(_event, resource: TResource) => setSelectedResource(resource)}
        aria-label={`${title} resource tabs`}
        variant="scrollable"
        scrollButtons="auto"
      >
        {availableResources.map(resource => (
          <Tab
            key={resource}
            value={resource}
            label={`${t(`resources.${resource}`)} (${rowsForResource(resource).length})`}
          />
        ))}
      </Tabs>
      <ResourceTable resource={activeResource} rows={rowsForResource(activeResource)} title={title} t={t} />
    </Stack>
  );
}

export type DataImportProps = {
  asButton?: boolean;
};

export const DataImport: React.FC<DataImportProps> = ({asButton}) => {
  const t = useTranslations('DataImport');
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
        showSnackbar({message: t('importCompleted')});
      }
    } catch (error) {
      showSnackbar({message: error instanceof Error ? error.message : t('importFailed')});
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
          <DismissableAlert severity="info">{t('selectArchiveDescription')}</DismissableAlert>
          <Button component="label" variant="outlined" startIcon={<FileUploadOutlined />} disabled={isSubmitting}>
            {t('chooseArchive')}
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
          {file && <Typography variant="body2">{t('selectedFile', {name: file.name})}</Typography>}
        </Stack>
      );
    }
    if (!result) return null;
    if (activeStep === 1) {
      return (
        <Stack spacing={3}>
          <DismissableAlert severity={result.summary.failed > 0 ? 'warning' : 'success'}>
            {t('previewSummary', result.summary)}
          </DismissableAlert>
          <ResourceTabs key="preview" title={t('preview')} rowsForResource={previewRows} t={t} />
        </Stack>
      );
    }
    if (activeStep === 2) {
      return (
        <Stack spacing={3}>
          <DismissableAlert severity="success">{t('successSummary', result.summary)}</DismissableAlert>
          <ResourceTabs
            key="successful-imports"
            title={t('successfulImports')}
            rowsForResource={successfulRows}
            t={t}
          />
        </Stack>
      );
    }
    if (activeStep === 3) {
      return (
        <Stack spacing={3}>
          <DismissableAlert severity={result.summary.failed > 0 ? 'warning' : 'success'}>
            {t('failedSummary', result.summary)}
          </DismissableAlert>
          {result.summary.failed > 0 ? (
            <ResourceTabs key="failed-imports" title={t('failedImports')} rowsForResource={failedRows} t={t} />
          ) : (
            <Typography>{t('noFailures')}</Typography>
          )}
        </Stack>
      );
    }
    return (
      <Stack spacing={2}>
        <DismissableAlert severity={result.summary.failed > 0 ? 'warning' : 'success'}>
          {t('finishedSummary', result.summary)}
        </DismissableAlert>
        <Typography>{t('reviewFailures')}</Typography>
      </Stack>
    );
  };

  const primaryAction = () => {
    if (activeStep === 0)
      return {disabled: !file || isSubmitting, label: t('previewFiles'), onClick: () => submit('preview')};
    if (activeStep === 1) {
      if (!result || result.summary.created === 0) {
        const hasFailures = Boolean(result?.summary.failed);
        return {
          disabled: false,
          label: hasFailures ? t('showFailedImports') : t('showImportResults'),
          onClick: () => setActiveStep(hasFailures ? 3 : 2),
        };
      }
      return {
        disabled: isSubmitting,
        label: t('importRecords', {count: result.summary.created}),
        onClick: () => submit('commit'),
      };
    }
    if (activeStep === 2) return {disabled: false, label: t('showFailedImports'), onClick: () => setActiveStep(3)};
    if (activeStep === 3) return {disabled: false, label: t('finish'), onClick: () => setActiveStep(4)};
    return {disabled: false, label: t('close'), onClick: close};
  };
  const action = primaryAction();

  return (
    <React.Fragment>
      {asButton ? (
        <Button variant="contained" startIcon={<FileUploadOutlined />} onClick={() => setOpen(true)}>
          {t('importData')}
        </Button>
      ) : (
        <Card>
          <Card.Header>
            <Stack>
              <Card.Title>{t('importData')}</Card.Title>
              <Card.Subtitle>{t('description')}</Card.Subtitle>
            </Stack>
          </Card.Header>
          <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button variant="contained" startIcon={<FileUploadOutlined />} onClick={() => setOpen(true)}>
              {t('importData')}
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
        <DialogTitle>{t('importData')}</DialogTitle>
        <Box sx={theme => ({position: 'absolute', top: theme.spacing(1), right: theme.spacing(1)})}>
          <FullscreenIconButton onClick={toggleFullscreen} isFullscreen={isFullscreenActive} />
          <CloseIconButton onClick={close} />
        </Box>
        <DialogContent>
          <Stack spacing={3}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {['uploadFile', 'previewFiles', 'successfulImports', 'failedImports', 'finish'].map(step => (
                <Step key={step}>
                  <StepLabel>{t(`steps.${step}`)}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box>{stepContent()}</Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isSubmitting} onClick={close}>
            {t('cancel')}
          </Button>
          {activeStep > 0 && activeStep < 2 && (
            <Button disabled={isSubmitting} onClick={() => setActiveStep(activeStep - 1)}>
              {t('back')}
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
