'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Grid, Typography} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {AttachmentList} from '@/components/Attachment/AttachmentList';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {useSnackbarContext} from '@/components/Snackbar';

export default function AttachmentsPage() {
  const {showSnackbar} = useSnackbarContext();
  const [attachments, setAttachments] = React.useState<TAttachmentWithUrl[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());
  const [attachmentCount, setAttachmentCount] = React.useState<number | undefined>();
  const [attachmentsSize, setAttachmentsSize] = React.useState<number | undefined>();

  React.useEffect(() => {
    const fetchAttachments = async () => {
      setIsLoading(true);
      setError(null);
      const [result, err] = await apiClient.backend.attachment.getAllTransactionAttachments();
      if (err) {
        setError(err);
        setIsLoading(false);
        return;
      }
      // Sort chronologically (newest first)
      const sorted = [...(result?.data ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setAttachments(sorted);
      setAttachmentCount(result?.attachmentCount);
      setAttachmentsSize(result?.attachmentsSize);
      setIsLoading(false);
    };

    fetchAttachments();
  }, []);

  const handleDelete = async (attachment: TAttachmentWithUrl) => {
    setDeletingIds(prev => new Set(prev).add(attachment.id));
    const [_, err] = await apiClient.backend.attachment.deleteById(attachment.id);
    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(attachment.id);
      return next;
    });
    if (err) {
      showSnackbar({message: `Failed to delete attachment: ${err.message}`});
      return;
    }
    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    setAttachmentCount(prev => (prev !== undefined ? prev - 1 : undefined));
    showSnackbar({message: 'Attachment deleted successfully'});
  };

  const subtitle =
    attachmentCount !== undefined && attachmentsSize !== undefined
      ? `${attachmentCount} attachment${attachmentCount !== 1 ? 's' : ''} · ${formatBytes(attachmentsSize)} total`
      : undefined;

  return (
    <ContentGrid title="Attachments">
      {subtitle && (
        <Grid size={12}>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Grid>
      )}
      <Grid size={{xs: 12, md: 8, lg: 6}}>
        <AttachmentList
          attachments={attachments}
          isLoading={isLoading}
          error={error}
          onDelete={handleDelete}
          deletingIds={deletingIds}
          emptyMessage="No attachments yet. Upload files via the Transactions page."
        />
      </Grid>
    </ContentGrid>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
