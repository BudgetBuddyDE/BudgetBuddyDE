'use client';

import type {TApplicationImportResult} from '@budgetbuddyde/api/applicationImport';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';
import {budgetSlice} from '@/lib/features/budgets/budgetSlice';
import {categorySlice} from '@/lib/features/categories/categorySlice';
import {paymentMethodSlice} from '@/lib/features/paymentMethods/paymentMethodSlice';
import {recurringPaymentSlice} from '@/lib/features/recurringPayments/recurringPaymentSlice';
import {transactionSlice} from '@/lib/features/transactions/transactionSlice';
import {useAppDispatch} from '@/lib/hooks';

const resourceLabels = {
  categories: 'Categories',
  'payment-methods': 'Payment methods',
  transactions: 'Transactions',
  'recurring-payments': 'Recurring payments',
  budgets: 'Budgets',
} as const;

function ResultOverview({result}: {result: TApplicationImportResult}) {
  const readyLabel = result.mode === 'preview' ? 'Ready' : 'Imported';
  return (
    <Stack spacing={2}>
      <Alert severity={result.summary.failed > 0 ? 'warning' : 'success'}>
        {readyLabel}: {result.summary.created}, skipped: {result.summary.skipped}, failed: {result.summary.failed}
      </Alert>
      {Object.entries(result.resources).map(([resource, resourceResult]) => {
        const records = [...resourceResult.failed, ...resourceResult.skipped];
        if (resourceResult.created.length === 0 && records.length === 0) return null;
        return (
          <Box key={resource}>
            <Typography variant="subtitle2" fontWeight="bold">
              {resourceLabels[resource as keyof typeof resourceLabels]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {readyLabel}: {resourceResult.created.length}, skipped: {resourceResult.skipped.length}, failed:{' '}
              {resourceResult.failed.length}
            </Typography>
            {records.map(record => (
              <Typography key={`${record.row}-${record.sourceId}-${record.message}`} variant="caption" display="block">
                Line {record.row}
                {record.sourceId ? ` (${record.sourceId})` : ''}: {record.message}
              </Typography>
            ))}
          </Box>
        );
      })}
    </Stack>
  );
}

export const DataImport = () => {
  const dispatch = useAppDispatch();
  const {showSnackbar} = useSnackbarContext();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<TApplicationImportResult | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
  };

  return (
    <React.Fragment>
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

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm" slotProps={{paper: {elevation: 0}}}>
        <DialogTitle>Import data</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{pt: 1}}>
            <Alert severity="info">
              Select a ZIP archive created by Application data export. Auth data and attachments are not imported.
            </Alert>
            <Button component="label" variant="outlined" startIcon={<FileUploadOutlined />} disabled={isSubmitting}>
              Choose export archive
              <input
                hidden
                type="file"
                accept="application/zip,.zip"
                onChange={event => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  setResult(null);
                }}
              />
            </Button>
            {file && <Typography variant="body2">Selected: {file.name}</Typography>}
            {result && (
              <React.Fragment>
                <Divider />
                <ResultOverview result={result} />
              </React.Fragment>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isSubmitting} onClick={close}>
            Close
          </Button>
          {!result || result.mode === 'commit' ? (
            <Button
              variant="contained"
              disabled={!file || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <FileUploadOutlined />}
              onClick={() => submit('preview')}
            >
              Preview import
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={isSubmitting || result.summary.created === 0}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <FileUploadOutlined />}
              onClick={() => submit('commit')}
            >
              Import {result.summary.created} records
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};
