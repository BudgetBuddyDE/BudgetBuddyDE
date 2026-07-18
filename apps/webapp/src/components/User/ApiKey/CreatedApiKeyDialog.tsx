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
  return (
    <Dialog
      open={Boolean(apiKey)}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      slotProps={{
        paper: {elevation: 0},
      }}
    >
      <DialogTitle>Copy your API key now</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{mb: 2}}>
          This is the only time the full API key will be shown. Copy it and store it somewhere secure before closing
          this dialog.
        </DialogContentText>
        <TextField
          fullWidth
          value={apiKey ?? ''}
          InputProps={{
            readOnly: true,
            endAdornment: apiKey ? (
              <Tooltip title="Copy API key">
                <IconButton onClick={() => onCopy(apiKey)} edge="end" aria-label="Copy API key">
                  <ContentCopyRounded />
                </IconButton>
              </Tooltip>
            ) : undefined,
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
            label="I have copied and securely stored this API key."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => apiKey && onCopy(apiKey)} color="inherit">
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button onClick={onClose} variant="contained" disabled={!acknowledged}>
          I understand, close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
