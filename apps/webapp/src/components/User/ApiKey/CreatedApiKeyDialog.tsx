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
import {useTranslations} from 'next-intl';
import React from 'react';

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
  const t = useTranslations('CreatedApiKey');
  return (
    <Dialog
      open={Boolean(apiKey)}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {elevation: 0},
      }}
    >
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{mb: 2}}>{t('description')}</DialogContentText>
        <TextField
          fullWidth
          value={apiKey ?? ''}
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: apiKey ? (
                <Tooltip title={t('copyTooltip')}>
                  <IconButton onClick={() => onCopy(apiKey)} edge="end" aria-label={t('copyTooltip')}>
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
            label={t('copiedAndStored')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => apiKey && onCopy(apiKey)} color="inherit">
          {copied ? t('copied') : t('copy')}
        </Button>
        <Button onClick={onClose} variant="contained" disabled={!acknowledged}>
          {t('understandClose')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
