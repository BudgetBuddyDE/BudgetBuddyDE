'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {CloudUploadRounded} from '@mui/icons-material';
import {Avatar, AvatarGroup, Box, ButtonBase} from '@mui/material';
import type React from 'react';

export type TransactionAttachmentPreviewStripProps = {
  attachments?: TAttachmentWithUrl[];
  attachmentCount?: number;
  previewLimit?: number;
  onClick?: () => void;
};

export const TransactionAttachmentPreviewStrip: React.FC<TransactionAttachmentPreviewStripProps> = ({
  attachments = [],
  attachmentCount,
  previewLimit = 3,
  onClick,
}) => {
  const totalAttachments = attachmentCount ?? attachments.length;
  if (totalAttachments <= 0) return null;
  const avatarContent = (
    <AvatarGroup max={previewLimit} total={totalAttachments}>
      {attachments.length > 0 ? (
        attachments.map(attachment => (
          <Avatar key={attachment.id} src={attachment.signedUrl} alt={attachment.fileName} variant="rounded" />
        ))
      ) : (
        <Avatar variant="rounded">
          <CloudUploadRounded />
        </Avatar>
      )}
    </AvatarGroup>
  );

  if (!onClick) return avatarContent;
  return (
    <ButtonBase
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={`Open ${totalAttachments} transaction attachments`}
      sx={{
        borderRadius: 1.25,
        justifyContent: 'flex-start',
        '&:hover .attachment-preview-surface': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{transition: 'transform 0.2s ease'}}>{avatarContent}</Box>
    </ButtonBase>
  );
};
