'use client';

import type {TTransaction} from '@budgetbuddyde/api/transaction';
import {AttachFileRounded} from '@mui/icons-material';
import {Box, Grid, Skeleton} from '@mui/material';
import type React from 'react';
import {AttachmentLightbox, AttachmentThumbnail, FileDropZone} from '@/components/Attachments';
import {DeleteDialog} from '@/components/Dialog';
import {NoResults} from '@/components/NoResults';
import {useTransactionAttachments} from './useTransactionAttachments';

/** Props for {@link TransactionAttachments}. */
export type TransactionAttachmentsProps = {
  transactionId: TTransaction['id'];
};

/**
 * Orchestrates all attachment functionality for a single transaction:
 * listing, uploading, viewing in a lightbox, downloading, and deleting.
 *
 * State is managed by {@link useTransactionAttachments}; rendering is
 * delegated to {@link AttachmentUploadZone}, {@link AttachmentThumbnail},
 * {@link AttachmentLightbox}, and `DeleteDialog`.
 */
export const TransactionAttachments: React.FC<TransactionAttachmentsProps> = ({transactionId}) => {
  const {state, dispatch, handleUpload, handleDownload, handleDeleteConfirm} = useTransactionAttachments(transactionId);
  const {attachments, isLoading, isUploading, isDragging, viewedAttachment, deletingAttachmentId} = state;

  return (
    <Box>
      <Box
        sx={{
          zIndex: 1,
          position: 'sticky',
          top: '-1px',
          mb: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <FileDropZone
          isUploading={isUploading}
          isDragging={isDragging}
          onUpload={handleUpload}
          onDraggingChange={dragging => dispatch({type: 'SET_DRAGGING', dragging})}
        />
      </Box>

      {isLoading ? (
        <Grid container spacing={1}>
          {[0, 1, 2].map(i => (
            <Grid key={i} size={{xs: 6, sm: 4}}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      ) : attachments.length > 0 ? (
        <Grid container spacing={1}>
          {attachments.map(attachment => (
            <Grid key={attachment.id} size={{xs: 6, sm: 4}}>
              <AttachmentThumbnail
                attachment={attachment}
                onView={a => dispatch({type: 'VIEW_OPEN', attachment: a})}
                onDownload={handleDownload}
                onDelete={a => dispatch({type: 'DELETE_OPEN', attachmentId: a.id})}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <NoResults icon={<AttachFileRounded />} text={'No attachments yet'} />
      )}

      <AttachmentLightbox
        attachment={viewedAttachment}
        onClose={() => dispatch({type: 'VIEW_CLOSE'})}
        onDownload={handleDownload}
      />

      <DeleteDialog
        open={deletingAttachmentId !== null}
        text={{content: 'Are you sure you want to delete this attachment?'}}
        onCancel={() => dispatch({type: 'DELETE_CLOSE'})}
        onClose={() => dispatch({type: 'DELETE_CLOSE'})}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};
