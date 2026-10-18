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
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {EntityIcon, useConsumeIntent} from '@/lib/ibn';

const PAGE_SIZE = 20;

export type AllAttachmentsClientProps = {
  initialAttachments: TAttachmentWithUrl[];
  initialTotalCount?: number;
};

/**
 * Client shell for the Attachments page. Receives server-fetched attachments
 * as `initialAttachments` and handles view, download, and delete interactions.
 *
 * Renders at most PAGE_SIZE thumbnails at a time to keep the initial paint
 * fast; a "Load more" button reveals the next batch.
 */
export const AllAttachmentsClient: React.FC<AllAttachmentsClientProps> = ({
  initialAttachments,
  initialTotalCount = initialAttachments.length,
}) => {
  const t = useAppTranslations();
  const {showSnackbar} = useSnackbarContext();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewedAttachment, setViewedAttachment] = useState<TAttachmentWithUrl | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<TAttachmentWithUrl['id'] | null>(null);

  const visibleAttachments = useMemo(() => attachments.slice(0, visibleCount), [attachments, visibleCount]);
  const hasMore = attachments.length < totalCount;

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
      showSnackbar({message: t('attachments.deleteFailedError', {error: error.message})});
      return;
    }
    showSnackbar({message: t('attachments.attachmentDeleted')});
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, [t, deletingAttachmentId, showSnackbar]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || attachments.length >= totalCount) return;

    const from = attachments.length;
    setIsLoadingMore(true);
    const [result, error] = await apiClient.backend.transaction.getAllTransactionAttachments({
      from,
      to: from + PAGE_SIZE,
    });
    setIsLoadingMore(false);

    if (error) {
      showSnackbar({message: t('attachments.failedToLoadMoreAttachmentsError', {error: error.message})});
      return;
    }

    const nextAttachments = result?.data ?? [];
    setAttachments(prev => [...prev, ...nextAttachments]);
    setTotalCount(result?.totalCount ?? totalCount);
    setVisibleCount(prev => prev + nextAttachments.length);
  }, [t, attachments.length, isLoadingMore, showSnackbar, totalCount]);

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
        showSnackbar({message: t('attachments.failedToOpenAttachmentError', {error: error.message})});
        return;
      }
      if (!attachment?.data) {
        showSnackbar({message: t('attachments.attachmentNotFound')});
        return;
      }
      setDeletingAttachmentId(attachment.data.id);
    },
    [t, attachments, showSnackbar],
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
        <NoResults
          icon={<EntityIcon entity="attachment" />}
          text={t('attachments.noAttachmentsHaveBeenAddedYet')}
          sx={{boxShadow: 6}}
        />
      ) : (
        <Grid container spacing={2}>
          {visibleAttachments.map((attachment, index) => (
            <Grid key={attachment.id} size={{xs: 12, sm: 6, md: 3}}>
              <AttachmentThumbnail
                attachment={attachment}
                onView={handleView}
                onDownload={handleDownload}
                onDelete={handleRequestDelete}
                preload={index < 4}
              />
            </Grid>
          ))}
          {hasMore && (
            <Grid size={{xs: 12}} sx={{display: 'flex', justifyContent: 'center', pt: 1}}>
              <Button variant="outlined" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore
                  ? t('common.loadingEllipsis')
                  : t('attachments.loadMoreCountRemaining', {count: totalCount - attachments.length})}
              </Button>
            </Grid>
          )}
        </Grid>
      )}

      <AttachmentLightbox attachment={viewedAttachment} onClose={handleLightboxClose} onDownload={handleDownload} />

      <DeleteDialog
        open={deletingAttachmentId !== null}
        text={{content: t('attachments.areYouSureYouWantToDeleteThisAttachment')}}
        onCancel={handleCancelDelete}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
