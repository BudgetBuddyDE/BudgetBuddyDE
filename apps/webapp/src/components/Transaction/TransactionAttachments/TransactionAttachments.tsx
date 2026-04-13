'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import type {TTransaction} from '@budgetbuddyde/api/transaction';
import {
  AttachFileRounded,
  CloudUploadRounded,
  DeleteRounded,
  DownloadRounded,
  ImageNotSupportedRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {DeleteDialog} from '@/components/Dialog';
import {useSnackbarContext} from '@/components/Snackbar';
import {ZoomTransition} from '@/components/Transition';
import {Formatter} from '@/utils/Formatter';

export type TransactionAttachmentsProps = {
  transactionId: TTransaction['id'];
};

type ViewState = {
  open: boolean;
  attachment: TAttachmentWithUrl | null;
};

type DeleteState = {
  open: boolean;
  attachmentId: TAttachmentWithUrl['id'] | null;
};

/**
 * Manages attachments for a single transaction: listing, viewing, downloading, uploading, and deleting.
 */
export const TransactionAttachments: React.FC<TransactionAttachmentsProps> = ({transactionId}) => {
  const theme = useTheme();
  const {showSnackbar} = useSnackbarContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = React.useState<TAttachmentWithUrl[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [viewState, setViewState] = React.useState<ViewState>({open: false, attachment: null});
  const [deleteState, setDeleteState] = React.useState<DeleteState>({open: false, attachmentId: null});

  const loadAttachments = React.useCallback(async () => {
    setIsLoading(true);
    const [result, error] = await apiClient.backend.transaction.getTransactionAttachments(transactionId);
    setIsLoading(false);
    if (error) {
      showSnackbar({message: `Failed to load attachments: ${error.message}`});
      return;
    }
    setAttachments(result.data ?? []);
  }, [transactionId, showSnackbar]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadAttachments is stable
  React.useEffect(() => {
    loadAttachments();
  }, [transactionId]);

  const handleUpload = React.useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsUploading(true);
      const [result, error] = await apiClient.backend.transaction.uploadTransactionAttachments(
        transactionId,
        files,
      );
      setIsUploading(false);
      if (error) {
        showSnackbar({message: `Upload failed: ${error.message}`});
        return;
      }
      showSnackbar({message: `${result.data?.length ?? 0} file(s) uploaded successfully`});
      loadAttachments();
    },
    [transactionId, showSnackbar, loadAttachments],
  );

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    handleUpload(files);
    // Reset input so the same file can be re-selected
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    handleUpload(files);
  };

  const handleDownload = (attachment: TAttachmentWithUrl) => {
    const anchor = document.createElement('a');
    anchor.href = attachment.signedUrl;
    anchor.download = attachment.fileName;
    anchor.rel = 'noopener noreferrer';
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteState.attachmentId;
    if (!id) return;
    setDeleteState({open: false, attachmentId: null});

    const [, error] = await apiClient.backend.transaction.deleteTransactionAttachments(transactionId, {
      attachmentIds: [id],
    });
    if (error) {
      showSnackbar({message: `Delete failed: ${error.message}`});
      return;
    }
    showSnackbar({message: 'Attachment deleted'});
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <Box>
      {/* Upload zone */}
      <Box
        onDragOver={event => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: `${theme.shape.borderRadius}px`,
          p: 2,
          mb: 1,
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragging ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          transition: 'background-color 0.2s, border-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          '&:hover': {
            backgroundColor: isUploading ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
          },
        }}
      >
        {isUploading ? (
          <CircularProgress size={20} />
        ) : (
          <CloudUploadRounded fontSize="small" color="action" />
        )}
        <Typography variant="body2" color="text.secondary">
          {isUploading ? 'Uploading…' : 'Click or drag & drop files to upload'}
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpg,image/jpeg,image/webp"
          multiple
          style={{display: 'none'}}
          onChange={handleFileInputChange}
          disabled={isUploading}
          data-testid="attachment-file-input"
        />
      </Box>

      {/* Attachment grid */}
      {isLoading ? (
        <Grid container spacing={1}>
          {[0, 1, 2].map(i => (
            <Grid key={i} size={{xs: 6, sm: 4}}>
              <Skeleton variant="rectangular" height={100} sx={{borderRadius: 1}} />
            </Grid>
          ))}
        </Grid>
      ) : attachments.length === 0 ? (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1}}>
          <AttachFileRounded color="disabled" />
          <Typography variant="body2" color="text.secondary">
            No attachments yet
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={1}>
          {attachments.map(attachment => (
            <Grid key={attachment.id} size={{xs: 6, sm: 4}}>
              <AttachmentThumbnail
                attachment={attachment}
                onView={a => setViewState({open: true, attachment: a})}
                onDownload={handleDownload}
                onDelete={a => setDeleteState({open: true, attachmentId: a.id})}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Lightbox dialog */}
      <Dialog
        open={viewState.open}
        onClose={() => setViewState({open: false, attachment: null})}
        maxWidth="md"
        fullWidth
        slots={{transition: ZoomTransition}}
        slotProps={{paper: {elevation: 0}}}
      >
        <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Typography variant="h6" component="span" noWrap sx={{flexGrow: 1, mr: 1}}>
            {viewState.attachment?.fileName}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{p: 1, textAlign: 'center'}}>
          {viewState.attachment && (
            // biome-ignore lint/a11y/useAltText: filename is visible in the title above
            <img
              src={viewState.attachment.signedUrl}
              alt={viewState.attachment.fileName}
              style={{maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4}}
            />
          )}
        </DialogContent>
        <DialogActions>
          {viewState.attachment && (
            <Button
              startIcon={<DownloadRounded />}
              onClick={() => handleDownload(viewState.attachment as TAttachmentWithUrl)}
            >
              Download
            </Button>
          )}
          <Button onClick={() => setViewState({open: false, attachment: null})}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <DeleteDialog
        open={deleteState.open}
        text={{content: 'Are you sure you want to delete this attachment?'}}
        onCancel={() => setDeleteState({open: false, attachmentId: null})}
        onClose={() => setDeleteState({open: false, attachmentId: null})}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

type AttachmentThumbnailProps = {
  attachment: TAttachmentWithUrl;
  onView: (a: TAttachmentWithUrl) => void;
  onDownload: (a: TAttachmentWithUrl) => void;
  onDelete: (a: TAttachmentWithUrl) => void;
};

const AttachmentThumbnail: React.FC<AttachmentThumbnailProps> = ({attachment, onView, onDownload, onDelete}) => {
  const theme = useTheme();
  const [imgError, setImgError] = React.useState(false);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: `${theme.shape.borderRadius}px`,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover .attachment-actions': {opacity: 1},
      }}
    >
      {imgError ? (
        <Box
          sx={{
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.action.hover,
          }}
        >
          <ImageNotSupportedRounded color="disabled" />
        </Box>
      ) : (
        // biome-ignore lint/a11y/useAltText: attachment filename is shown as tooltip
        <img
          src={attachment.signedUrl}
          alt={attachment.fileName}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: 100,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      {/* Hover overlay with actions */}
      <Box
        className="attachment-actions"
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          transition: 'opacity 0.2s',
          backgroundColor: alpha(theme.palette.common.black, 0.5),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
        }}
      >
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(attachment)} sx={{color: 'white'}}>
            <VisibilityRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton size="small" onClick={() => onDownload(attachment)} sx={{color: 'white'}}>
            <DownloadRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(attachment)} sx={{color: 'white'}}>
            <DeleteRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Tooltip title={attachment.fileName}>
        <Typography
          variant="caption"
          noWrap
          sx={{
            display: 'block',
            px: 0.5,
            py: 0.25,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {attachment.fileName}
        </Typography>
      </Tooltip>
    </Box>
  );
};
