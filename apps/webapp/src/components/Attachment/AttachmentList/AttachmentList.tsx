'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {AttachFileRounded} from '@mui/icons-material';
import {CircularProgress, Stack, type StackProps, Typography} from '@mui/material';
import type React from 'react';
import {NoResults} from '@/components/NoResults';
import {AttachmentItem} from '../AttachmentItem';

export type AttachmentListProps = {
  attachments: TAttachmentWithUrl[];
  isLoading?: boolean;
  error?: Error | null;
  onDelete?: (attachment: TAttachmentWithUrl) => void | Promise<void>;
  deletingIds?: Set<string>;
  emptyMessage?: string;
} & Pick<StackProps, 'sx'>;

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  isLoading = false,
  error,
  onDelete,
  deletingIds = new Set(),
  emptyMessage = 'No attachments found',
  sx,
}) => {
  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" p={3} sx={sx}>
        <CircularProgress size={32} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack sx={sx}>
        <Typography color="error" variant="body2" textAlign="center">
          {error.message}
        </Typography>
      </Stack>
    );
  }

  if (attachments.length === 0) {
    return (
      <Stack sx={sx}>
        <NoResults text={emptyMessage} icon={<AttachFileRounded />} />
      </Stack>
    );
  }

  return (
    <Stack gap={1} sx={sx} data-testid="attachment-list">
      {attachments.map(attachment => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onDelete={onDelete}
          isDeleting={deletingIds.has(attachment.id)}
        />
      ))}
    </Stack>
  );
};
