'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Button, Grid} from '@mui/material';
import type React from 'react';
import {useCallback, useMemo, useState} from 'react';
import {apiClient} from '@/apiClient';
import {AttachmentLightbox, AttachmentThumbnail} from '@/components/Attachments';
import {DeleteDialog} from '@/components/Dialog';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/components/Snackbar';
import {EntityIcon, useConsumeIntent} from '@/lib/ibn';

const PAGE_SIZE = 20;

export type AllAttachmentsClientProps = {
  initialAttachments: TAttachmentWithUrl[];
};

/**
 * Client shell for the Attachments page. Receives server-fetched attachments
 * as `initialAttachments` and handles view, download, and delete interactions.
 *
 * Renders at most PAGE_SIZE thumbnails at a time to keep the initial paint
 * fast; a "Load more" button reveals the next batch.
 */
export const AllAttachmentsClient: React.FC<AllAttachmentsClientProps> = ({initialAttachments}) => {
  const {showSnackbar} = useSnackbarContext();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [viewedAttachment, setViewedAttachment] = useState<TAttachmentWithUrl | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<TAttachmentWithUrl['id'] | null>(null);

  const visibleAttachments = useMemo(() => attachments.slice(0, visibleCount), [attachments, visibleCount]);
  const hasMore = visibleCount < attachments.length;

  const handleView = useCallback((attachment: TAttachmentWithUrl) => {
    setViewedAttachment(attachment);
  }, []);

  const handleDownload = useCallback((attachment: TAttachmentWithUrl) => {
    const anchor = document.createElement('a');
    anchor.href = attachment.signedUrl;
    anchor.download = attachment.fileName;
    anchor.rel = 'noopener noreferrer';
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, []);

  const handleRequestDelete = useCallback((attachment: TAttachmentWithUrl) => {
    setDeletingAttachmentId(attachment.id);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeletingAttachmentId(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const id = deletingAttachmentId;
    if (!id) return;
    setDeletingAttachmentId(null);

    const [, error] = await apiClient.backend.attachment.deleteById(id);
    if (error) {
      showSnackbar({message: `Delete failed: ${error.message}`});
      return;
    }
    showSnackbar({message: 'Attachment deleted'});
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, [deletingAttachmentId, showSnackbar]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, attachments.length));
  }, [attachments.length]);

  const handleLightboxClose = useCallback(() => {
    setViewedAttachment(null);
  }, []);

  const handleIntentDelete = useCallback(
    async (id: string) => {
      const existingAttachment = attachments.find(attachment => attachment.id === id);
      if (existingAttachment) {
        setDeletingAttachmentId(existingAttachment.id);
        return;
      }

      const [attachment, error] = await apiClient.backend.attachment.getById(id as TAttachmentWithUrl['id']);
      if (error) {
        showSnackbar({message: `Failed to open attachment: ${error.message}`});
        return;
      }
      if (!attachment?.data) {
        showSnackbar({message: 'Attachment not found'});
        return;
      }
      setDeletingAttachmentId(attachment.data.id);
    },
    [attachments, showSnackbar],
  );

  const handleInvalidIntent = useCallback(
    (message: string) => {
      showSnackbar({message});
    },
    [showSnackbar],
  );

  useConsumeIntent('attachment', {onDelete: handleIntentDelete, onInvalid: handleInvalidIntent});

  return (
    <>
      {attachments.length === 0 ? (
        <NoResults icon={<EntityIcon entity="attachment" />} text="No attachments have been added yet" />
      ) : (
        <Grid container spacing={2}>
          {visibleAttachments.map((attachment, index) => (
            <Grid key={attachment.id} size={{xs: 12, sm: 6, md: 3}}>
              <AttachmentThumbnail
                attachment={attachment}
                onView={handleView}
                onDownload={handleDownload}
                onDelete={handleRequestDelete}
                priority={index < 4}
              />
            </Grid>
          ))}
          {hasMore && (
            <Grid size={{xs: 12}} sx={{display: 'flex', justifyContent: 'center', pt: 1}}>
              <Button variant="outlined" onClick={handleLoadMore}>
                Load more ({attachments.length - visibleCount} remaining)
              </Button>
            </Grid>
          )}
        </Grid>
      )}

      <AttachmentLightbox attachment={viewedAttachment} onClose={handleLightboxClose} onDownload={handleDownload} />

      <DeleteDialog
        open={deletingAttachmentId !== null}
        text={{content: 'Are you sure you want to delete this attachment?'}}
        onCancel={handleCancelDelete}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
