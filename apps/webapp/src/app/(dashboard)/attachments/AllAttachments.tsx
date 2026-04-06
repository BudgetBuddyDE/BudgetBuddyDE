'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {
  DeleteRounded,
  DownloadRounded,
  ImageNotSupportedRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';
import {apiClient} from '@/apiClient';
import {DeleteDialog} from '@/components/Dialog';
import {useSnackbarContext} from '@/components/Snackbar';
import {ZoomTransition} from '@/components/Transition';

/**
 * Client component that loads and renders all transaction attachments for the
 * authenticated user, sorted chronologically. Provides view, download, and
 * delete actions for each attachment.
 */
export const AllAttachments: React.FC = () => {
  const {showSnackbar} = useSnackbarContext();

  const [attachments, setAttachments] = React.useState<TAttachmentWithUrl[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewState, setViewState] = React.useState<{open: boolean; attachment: TAttachmentWithUrl | null}>({
    open: false,
    attachment: null,
  });
  const [deleteState, setDeleteState] = React.useState<{open: boolean; attachmentId: TAttachmentWithUrl['id'] | null}>({
    open: false,
    attachmentId: null,
  });

  const loadAttachments = React.useCallback(async () => {
    setIsLoading(true);
    const [result, error] = await apiClient.backend.transaction.getAllTransactionAttachments();
    setIsLoading(false);
    if (error) {
      showSnackbar({message: `Failed to load attachments: ${error.message}`});
      return;
    }
    // Sort chronologically descending (newest first)
    const sorted = [...(result.data ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setAttachments(sorted);
  }, [showSnackbar]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadAttachments is stable
  React.useEffect(() => {
    loadAttachments();
  }, []);

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

    const [, error] = await apiClient.backend.attachment.deleteById(id);
    if (error) {
      showSnackbar({message: `Delete failed: ${error.message}`});
      return;
    }
    showSnackbar({message: 'Attachment deleted'});
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[...Array(6)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Skeletons have no meaningful key
          <Grid key={i} size={{xs: 12, sm: 6, md: 4}}>
            <Skeleton variant="rectangular" height={200} sx={{borderRadius: 1}} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (attachments.length === 0) {
    return (
      <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2}}>
        <ImageNotSupportedRounded sx={{fontSize: 64}} color="disabled" />
        <Typography variant="h6" color="text.secondary">
          No attachments found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload files via the Attachments option in the transaction menu
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {attachments.map(attachment => (
          <Grid key={attachment.id} size={{xs: 12, sm: 6, md: 4}}>
            <AttachmentCard
              attachment={attachment}
              onView={a => setViewState({open: true, attachment: a})}
              onDownload={handleDownload}
              onDelete={a => setDeleteState({open: true, attachmentId: a.id})}
            />
          </Grid>
        ))}
      </Grid>

      {/* Lightbox dialog */}
      <Dialog
        open={viewState.open}
        onClose={() => setViewState({open: false, attachment: null})}
        maxWidth="md"
        fullWidth
        slots={{transition: ZoomTransition}}
        slotProps={{paper: {elevation: 0}}}
      >
        <DialogTitle>{viewState.attachment?.fileName}</DialogTitle>
        <DialogContent sx={{p: 1, textAlign: 'center'}}>
          {viewState.attachment && (
            // biome-ignore lint/a11y/useAltText: filename shown in dialog title
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

      <DeleteDialog
        open={deleteState.open}
        text={{content: 'Are you sure you want to delete this attachment?'}}
        onCancel={() => setDeleteState({open: false, attachmentId: null})}
        onClose={() => setDeleteState({open: false, attachmentId: null})}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

type AttachmentCardProps = {
  attachment: TAttachmentWithUrl;
  onView: (a: TAttachmentWithUrl) => void;
  onDownload: (a: TAttachmentWithUrl) => void;
  onDelete: (a: TAttachmentWithUrl) => void;
};

const AttachmentCard: React.FC<AttachmentCardProps> = ({attachment, onView, onDownload, onDelete}) => {
  const [imgError, setImgError] = React.useState(false);
  const formattedDate = format(new Date(attachment.createdAt), 'PP');

  return (
    <Card elevation={0} sx={{border: '1px solid', borderColor: 'divider'}}>
      {imgError ? (
        <Box
          sx={{
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'action.hover',
          }}
        >
          <ImageNotSupportedRounded color="disabled" sx={{fontSize: 48}} />
        </Box>
      ) : (
        <CardMedia
          component="img"
          height={160}
          image={attachment.signedUrl}
          alt={attachment.fileName}
          onError={() => setImgError(true)}
          sx={{objectFit: 'cover', cursor: 'pointer'}}
          onClick={() => onView(attachment)}
        />
      )}
      <Box sx={{px: 1.5, pt: 1, pb: 0.5}}>
        <Tooltip title={attachment.fileName}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {attachment.fileName}
          </Typography>
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          {formattedDate}
        </Typography>
      </Box>
      <CardActions sx={{justifyContent: 'flex-end', pt: 0}}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(attachment)}>
            <VisibilityRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton size="small" onClick={() => onDownload(attachment)}>
            <DownloadRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(attachment)}>
            <DeleteRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};
