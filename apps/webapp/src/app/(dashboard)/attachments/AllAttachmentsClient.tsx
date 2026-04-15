'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {AttachFileRounded} from '@mui/icons-material';
import {Grid} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {AttachmentLightbox, AttachmentThumbnail} from '@/components/Attachments';
import {DeleteDialog} from '@/components/Dialog';
import {NoResults} from '@/components/NoResults';
import {useSnackbarContext} from '@/components/Snackbar';

export type AllAttachmentsClientProps = {
  initialAttachments: TAttachmentWithUrl[];
};

/**
 * Client shell for the Attachments page. Receives server-fetched attachments
 * as `initialAttachments` and handles view, download, and delete interactions.
 */
export const AllAttachmentsClient: React.FC<AllAttachmentsClientProps> = ({initialAttachments}) => {
  const {showSnackbar} = useSnackbarContext();
  const [attachments, setAttachments] = React.useState(initialAttachments);
  const [viewedAttachment, setViewedAttachment] = React.useState<TAttachmentWithUrl | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = React.useState<TAttachmentWithUrl['id'] | null>(null);

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
  };

  if (attachments.length === 0) {
    return <NoResults icon={<AttachFileRounded />} text="No attachments have been added yet" />;
  }

  return (
    <>
      <Grid container spacing={2}>
        {attachments.map(attachment => (
          <Grid key={attachment.id} size={{xs: 12, sm: 6, md: 3}}>
            <AttachmentThumbnail
              attachment={attachment}
              onView={setViewedAttachment}
              onDownload={handleDownload}
              onDelete={a => setDeletingAttachmentId(a.id)}
            />
          </Grid>
        ))}
      </Grid>

      <AttachmentLightbox
        attachment={viewedAttachment}
        onClose={() => setViewedAttachment(null)}
        onDownload={handleDownload}
      />

      <DeleteDialog
        open={deletingAttachmentId !== null}
        text={{content: 'Are you sure you want to delete this attachment?'}}
        onCancel={() => setDeletingAttachmentId(null)}
        onClose={() => setDeletingAttachmentId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
