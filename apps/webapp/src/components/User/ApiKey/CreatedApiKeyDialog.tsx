'use client';

import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type CreatedApiKeyDialogProps = {
  apiKey: string | null;
  copied: boolean;
  acknowledged: boolean;
  onCopy: (key: string) => void;
  onAcknowledgedChange: (acknowledged: boolean) => void;
  onClose: () => void;
};

export const CreatedApiKeyDialog: React.FC<CreatedApiKeyDialogProps> = ({
  apiKey,
  copied,
  acknowledged,
  onCopy,
  onAcknowledgedChange,
  onClose,
}) => {
  const t = useAppTranslations();
  return (
    <Dialog
      open={Boolean(apiKey)}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {elevation: 0},
      }}
    >
      <DialogTitle>{t('account.apiKeys.copyYourAPIKeyNow')}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{mb: 2}}>{t('account.apiKeys.copyKeyWarning')}</DialogContentText>
        <TextField
          fullWidth
          value={apiKey ?? ''}
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: apiKey ? (
                <Tooltip title={t('account.apiKeys.copyAPIKey')}>
                  <IconButton onClick={() => onCopy(apiKey)} edge="end" aria-label={t('account.apiKeys.copyAPIKey')}>
                    <ContentCopyRounded />
                  </IconButton>
                </Tooltip>
              ) : undefined,
            },
          }}
        />
        <Box sx={{mt: 2}}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acknowledged}
                onChange={event => {
                  onAcknowledgedChange(event.target.checked);
                }}
              />
            }
            label={t('account.apiKeys.iHaveCopiedAndSecurelyStoredThisAPIKey')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => apiKey && onCopy(apiKey)} color="inherit">
          {copied ? t('account.apiKeys.copied') : t('account.apiKeys.copy')}
        </Button>
        <Button onClick={onClose} variant="contained" disabled={!acknowledged}>
          {t('account.apiKeys.iUnderstandClose')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
