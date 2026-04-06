'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {apiClient} from '@/apiClient';
import {AttachmentGrid} from '@/components/Attachment/AttachmentGrid';
import {AttachmentViewDialog} from '@/components/Attachment/AttachmentViewDialog';
import {CloseIconButton} from '@/components/Button';
import {useSnackbarContext} from '@/components/Snackbar';
import {ZoomTransition} from '@/components/Transition';

export type TransactionAttachmentDialogProps = {
  open: boolean;
  transaction: TExpandedTransaction | null;
  onClose: DialogProps['onClose'];
  onAttachmentsChanged?: () => void;
};

export const TransactionAttachmentDialog: React.FC<TransactionAttachmentDialogProps> = ({
  open,
  transaction,
  onClose,
  onAttachmentsChanged,
}) => {
  const theme = useTheme();
  const isFullscreen = useMediaQuery(theme.breakpoints.down('md'));
  const {showSnackbar} = useSnackbarContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<TAttachmentWithUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewAttachment, setViewAttachment] = useState<TAttachmentWithUrl | null>(null);

  const loadAttachments = useCallback(async () => {
    if (!transaction) return;
    setLoading(true);
    setError(null);
    const [result, err] = await apiClient.backend.transaction.getTransactionAttachments(transaction.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setAttachments(result?.data ?? []);
  }, [transaction]);

  useEffect(() => {
    if (open && transaction) {
      loadAttachments();
    } else {
      setAttachments([]);
      setError(null);
    }
  }, [open, transaction, loadAttachments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !transaction) return;
    setUploading(true);
    const fileArray = Array.from(files);
    const [, err] = await apiClient.backend.transaction.uploadTransactionAttachments(transaction.id, fileArray);
    setUploading(false);
    if (err) {
      showSnackbar({message: `Upload failed: ${err.message}`});
      return;
    }
    showSnackbar({message: `${fileArray.length} file(s) uploaded successfully`});
    loadAttachments();
    onAttachmentsChanged?.();
  };

  const handleDelete = async (attachment: TAttachmentWithUrl) => {
    if (!transaction) return;
    const [, err] = await apiClient.backend.transaction.deleteTransactionAttachments(transaction.id, {
      attachmentIds: [attachment.id],
    });
    if (err) {
      showSnackbar({message: `Delete failed: ${err.message}`});
      return;
    }
    showSnackbar({message: 'Attachment deleted'});
    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    onAttachmentsChanged?.();
  };

  const handleDownload = (attachment: TAttachmentWithUrl) => {
    const link = document.createElement('a');
    link.href = attachment.signedUrl;
    link.download = attachment.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isFullscreen}
        maxWidth="md"
        fullWidth
        slots={{transition: ZoomTransition}}
        slotProps={{paper: {elevation: 0}}}
      >
        <DialogTitle sx={{pr: 6}}>
          Attachments
          {transaction && (
            <Typography variant="body2" color="text.secondary">
              {transaction.receiver}
            </Typography>
          )}
        </DialogTitle>
        <CloseIconButton
          onClick={event => onClose?.(event, 'escapeKeyDown')}
          sx={theme => ({
            position: 'absolute',
            top: theme.spacing(1),
            right: theme.spacing(1),
          })}
        />
        <DialogContent>
          {loading && (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{mb: 2}}>
              {error}
            </Alert>
          )}
          {!loading && !error && (
            <AttachmentGrid
              attachments={attachments}
              onView={setViewAttachment}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          )}
        </DialogContent>
        <DialogActions>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpg,image/jpeg,image/webp"
            style={{display: 'none'}}
            onChange={e => handleUpload(e.target.files)}
          />
          <Button
            startIcon={uploading ? <CircularProgress size={16} /> : <AttachFileIcon />}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
          <Button onClick={event => onClose?.(event, 'escapeKeyDown')}>Close</Button>
        </DialogActions>
      </Dialog>

      <AttachmentViewDialog
        open={viewAttachment !== null}
        attachment={viewAttachment}
        onClose={() => setViewAttachment(null)}
      />
    </>
  );
};
