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
import {useAppTranslations} from '@/hooks/useAppTranslations';

type TExportFormat = 'csv' | 'json';

// Order matters here, as the order is used to determine the order of the checkboxes in the UI.
const applicationResources = [
  ['transactions', 'settings.dataExport.resourceTransactions'],
  ['recurring-payments', 'settings.dataExport.resourceRecurringPayments'],
  ['budgets', 'settings.dataExport.resourceBudgets'],
  ['payment-methods', 'settings.dataExport.resourcePaymentMethods'],
  ['categories', 'settings.dataExport.resourceCategories'],
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
  const t = useAppTranslations();
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
      showSnackbar({message: t('settings.dataExport.yourExportIsDownloading')});
    } catch (error) {
      showSnackbar({
        message: error instanceof Error ? error.message : t('settings.dataExport.theExportCouldNotBeCreated'),
        action: <Button onClick={handleExport}>{t('settings.dataExport.tryAgain')}</Button>,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <React.Fragment>
      {asButton ? (
        <Button variant="contained" startIcon={<FileDownloadOutlined />} onClick={() => setOpen(true)}>
          {t('settings.dataExport.exportData')}
        </Button>
      ) : (
        <Card>
          <Card.Header>
            <Stack>
              <Card.Title>{t('settings.dataExport.exportData')}</Card.Title>
              <Card.Subtitle>{t('settings.dataExport.downloadACopyOfYourAccountAndApplicationData')}</Card.Subtitle>
            </Stack>
          </Card.Header>
          <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button variant="contained" startIcon={<FileDownloadOutlined />} onClick={() => setOpen(true)}>
              {t('settings.dataExport.exportData')}
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
        <DialogTitle>{t('settings.dataExport.exportData')}</DialogTitle>
        <Box sx={theme => ({position: 'absolute', top: theme.spacing(1), right: theme.spacing(1)})}>
          <FullscreenIconButton onClick={toggleFullscreen} isFullscreen={isFullscreenActive} />
          <CloseIconButton onClick={close} />
        </Box>
        <DialogContent>
          <Stack spacing={3} sx={{pt: 1}}>
            <FormControl>
              <FormLabel id="export-format-label">{t('settings.dataExport.format')}</FormLabel>
              <RadioGroup
                row
                aria-labelledby="export-format-label"
                value={format}
                onChange={event => setFormat(event.target.value as TExportFormat)}
              >
                <FormControlLabel value="json" control={<Radio />} label={t('settings.dataExport.json')} />
                <FormControlLabel value="csv" control={<Radio />} label={t('settings.dataExport.csv')} />
              </RadioGroup>
            </FormControl>

            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {t('settings.dataExport.include')}
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={includeAuth} onChange={event => setIncludeAuth(event.target.checked)} />}
                  label={t('settings.dataExport.authData')}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    ml: 4.5,
                  }}
                >
                  {t('settings.dataExport.profileSessionsLinkedAccountsAndAPIKeyMetadataSecretsAreNeverExported')}
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allApplicationResourcesSelected}
                      indeterminate={includeApplication && !allApplicationResourcesSelected}
                      onChange={event => toggleApplication(event.target.checked)}
                    />
                  }
                  label={t('settings.dataExport.applicationData')}
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
                        label={t(label)}
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
                  label={t('settings.dataExport.attachments')}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    ml: 4.5,
                  }}
                >
                  {t('settings.dataExport.uploadedFilesAttachmentMetadataAndTransactionAssignments')}
                </Typography>
              </FormGroup>
            </Box>

            <Alert severity="info">{t('settings.dataExport.archiveIncludesSelectedResources')}</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isExporting} onClick={() => setOpen(false)}>
            {t('settings.dataExport.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={isExporting || (!includeAuth && !includeApplication && !includeAttachments)}
            startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlined />}
            onClick={handleExport}
          >
            {t('settings.dataExport.export')}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};
