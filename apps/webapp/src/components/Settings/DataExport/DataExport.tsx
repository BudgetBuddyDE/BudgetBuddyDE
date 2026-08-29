'use client';

import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';

type TExportFormat = 'csv' | 'json';

const applicationResources = [
  ['categories', 'Categories'],
  ['payment-methods', 'Payment methods'],
  ['transactions', 'Transactions'],
  ['recurring-payments', 'Recurring payments'],
  ['budgets', 'Budgets'],
] as const;

type TApplicationResource = (typeof applicationResources)[number][0];

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function downloadExport(url: URL, filename: string) {
  const response = await fetch(url, {credentials: 'include', cache: 'no-store'});
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? error?.error ?? 'The export could not be created.');
  }
  downloadBlob(await response.blob(), filename);
}

export const DataExport = () => {
  const {showSnackbar} = useSnackbarContext();
  const [open, setOpen] = React.useState(false);
  const [format, setFormat] = React.useState<TExportFormat>('json');
  const [includeAuth, setIncludeAuth] = React.useState(false);
  const [resources, setResources] = React.useState<ReadonlySet<TApplicationResource>>(
    () => new Set(applicationResources.map(([resource]) => resource)),
  );
  const [isExporting, setIsExporting] = React.useState(false);

  const includeApplication = resources.size > 0;
  const allApplicationResourcesSelected = resources.size === applicationResources.length;

  const toggleApplication = (checked: boolean) => {
    setResources(checked ? new Set(applicationResources.map(([resource]) => resource)) : new Set());
  };

  const toggleResource = (resource: TApplicationResource, checked: boolean) => {
    setResources(previous => {
      const next = new Set(previous);
      if (checked) next.add(resource);
      else next.delete(resource);
      return next;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const downloads: Promise<void>[] = [];

      if (includeAuth) {
        const authUrl = new URL('/api/export', process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST || 'http://localhost:8080');
        authUrl.searchParams.set('format', format);
        downloads.push(downloadExport(authUrl, `budgetbuddy-auth-export-${date}.zip`));
      }

      if (includeApplication) {
        const applicationUrl = new URL(
          '/api/application/export',
          process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST || 'http://localhost:9000',
        );
        applicationUrl.searchParams.set('format', format);
        resources.forEach(resource => applicationUrl.searchParams.append('resources', resource));
        downloads.push(downloadExport(applicationUrl, `budgetbuddy-application-export-${date}.zip`));
      }

      await Promise.all(downloads);
      setOpen(false);
      showSnackbar({message: 'Your export is downloading.'});
    } catch (error) {
      showSnackbar({
        message: error instanceof Error ? error.message : 'The export could not be created.',
        action: <Button onClick={handleExport}>Try again</Button>,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <React.Fragment>
      <Card>
        <Card.Header>
          <Stack>
            <Card.Title>Export data</Card.Title>
            <Card.Subtitle>Download a copy of your account and application data</Card.Subtitle>
          </Stack>
        </Card.Header>
        <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
          <Button variant="contained" startIcon={<FileDownloadOutlined />} onClick={() => setOpen(true)}>
            Export data
          </Button>
        </Card.Footer>
      </Card>

      <Dialog
        open={open}
        onClose={() => !isExporting && setOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {elevation: 0},
        }}
      >
        <DialogTitle>Export data</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{pt: 1}}>
            <FormControl>
              <FormLabel id="export-format-label">Format</FormLabel>
              <RadioGroup
                row
                aria-labelledby="export-format-label"
                value={format}
                onChange={event => setFormat(event.target.value as TExportFormat)}
              >
                <FormControlLabel value="json" control={<Radio />} label="JSON" />
                <FormControlLabel value="csv" control={<Radio />} label="CSV" />
              </RadioGroup>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Include
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={includeAuth} onChange={event => setIncludeAuth(event.target.checked)} />}
                  label="Auth data"
                />
                <Typography variant="caption" color="text.secondary" sx={{ml: 4.5}}>
                  Profile, sessions, linked accounts and API-key metadata. Secrets are never exported.
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allApplicationResourcesSelected}
                      indeterminate={includeApplication && !allApplicationResourcesSelected}
                      onChange={event => toggleApplication(event.target.checked)}
                    />
                  }
                  label="Application data"
                />
                <Collapse in={includeApplication} unmountOnExit>
                  <FormGroup sx={{ml: 4}}>
                    {applicationResources.map(([resource, label]) => (
                      <FormControlLabel
                        key={resource}
                        control={
                          <Checkbox
                            checked={resources.has(resource)}
                            onChange={event => toggleResource(resource, event.target.checked)}
                          />
                        }
                        label={label}
                      />
                    ))}
                  </FormGroup>
                </Collapse>

                <FormControlLabel control={<Checkbox disabled />} label="Attachments (not available yet)" />
              </FormGroup>
            </Box>

            <Alert severity="info">
              Each selected main category downloads as a separate ZIP archive. The archive contains one file per
              selected resource and an export manifest.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isExporting} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isExporting || (!includeAuth && !includeApplication)}
            startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlined />}
            onClick={handleExport}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};
