'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Grid, Typography} from '@mui/material';
import type React from 'react';
import {AttachmentCard} from '../AttachmentCard';

export type AttachmentGridProps = {
  attachments: TAttachmentWithUrl[];
  onView?: (attachment: TAttachmentWithUrl) => void;
  onDownload?: (attachment: TAttachmentWithUrl) => void;
  onDelete?: (attachment: TAttachmentWithUrl) => void;
};

export const AttachmentGrid: React.FC<AttachmentGridProps> = ({attachments, onView, onDownload, onDelete}) => {
  if (attachments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 4}}>
        No attachments yet.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {attachments.map(attachment => (
        <Grid key={attachment.id} size={{xs: 12, sm: 6, md: 4}}>
          <AttachmentCard attachment={attachment} onView={onView} onDownload={onDownload} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
};
