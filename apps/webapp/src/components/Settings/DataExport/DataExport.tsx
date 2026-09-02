'use client';

import type {TResult} from '@budgetbuddyde/api';
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
import {apiClient} from '@/apiClient';
import {CloseIconButton, FullscreenIconButton} from '@/components/Button';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';

type TExportFormat = 'csv' | 'json';

// Order matters here, as the order is used to determine the order of the checkboxes in the UI.
const applicationResources = [
  ['transactions', 'Transactions'],
  ['recurring-payments', 'Recurring payments'],
  ['budgets', 'Budgets'],
  ['payment-methods', 'Payment methods'],
  ['categories', 'Categories'],
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

async function downloadExport(request: Promise<TResult<Blob>>, filename: string) {
  const [blob, error] = await request;
  if (error) throw error;
  downloadBlob(blob, filename);
}

export type DataExportProps = {
  asButton?: boolean;
};

export const DataExport: React.FC<DataExportProps> = ({asButton}) => {
  const {showSnackbar} = useSnackbarContext();
  const [open, setOpen] = React.useState(false);
  const [format, setFormat] = React.useState<TExportFormat>('json');
  const [includeAuth, setIncludeAuth] = React.useState(false);
  const [resources, setResources] = React.useState<ReadonlySet<TApplicationResource>>(
    () => new Set(applicationResources.map(([resource]) => resource)),
  );
  const [includeAttachments, setIncludeAttachments] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreenActive(prev => !prev);
  };

  const close = React.useCallback(() => {
    return !isExporting && setOpen(false);
  }, [isExporting]);

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
        downloads.push(
          downloadExport(apiClient.auth.dataExport.exportArchive(format), `budgetbuddy-auth-export-${date}.zip`),
        );
      }

      if (includeApplication) {
        downloads.push(
          downloadExport(
            apiClient.backend.application.exportArchive({format, resources: Array.from(resources)}),
            `budgetbuddy-application-export-${date}.zip`,
          ),
        );
      }

      if (includeAttachments) {
        downloads.push(
          downloadExport(
            apiClient.backend.application.exportArchive({format, resources: ['attachments']}),
            `budgetbuddy-attachments-export-${date}.zip`,
          ),
        );
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
      {asButton ? (
        <Button variant="contained" startIcon={<FileDownloadOutlined />} onClick={() => setOpen(true)}>
          Export data
        </Button>
      ) : (
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
      )}

      <Dialog
        open={open}
        onClose={() => !isExporting && setOpen(false)}
        fullScreen={isFullscreenActive}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {elevation: 0},
        }}
      >
        <DialogTitle>Export data</DialogTitle>
        <Box sx={theme => ({position: 'absolute', top: theme.spacing(1), right: theme.spacing(1)})}>
          <FullscreenIconButton onClick={toggleFullscreen} isFullscreen={isFullscreenActive} />
          <CloseIconButton onClick={close} />
        </Box>
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
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                }}
              >
                Include
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={includeAuth} onChange={event => setIncludeAuth(event.target.checked)} />}
                  label="Auth data"
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    ml: 4.5,
                  }}
                >
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

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeAttachments}
                      onChange={event => setIncludeAttachments(event.target.checked)}
                    />
                  }
                  label="Attachments"
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    ml: 4.5,
                  }}
                >
                  Uploaded files, attachment metadata and transaction assignments.
                </Typography>
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
            disabled={isExporting || (!includeAuth && !includeApplication && !includeAttachments)}
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
