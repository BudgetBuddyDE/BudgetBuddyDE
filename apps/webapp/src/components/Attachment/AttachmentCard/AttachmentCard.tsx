'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {Box, Card, CardContent, CardMedia, IconButton, Tooltip, Typography} from '@mui/material';
import type React from 'react';

export type AttachmentCardProps = {
  attachment: TAttachmentWithUrl;
  onView?: (attachment: TAttachmentWithUrl) => void;
  onDownload?: (attachment: TAttachmentWithUrl) => void;
  onDelete?: (attachment: TAttachmentWithUrl) => void;
};

const IMAGE_CONTENT_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

function isImage(contentType: string): boolean {
  return IMAGE_CONTENT_TYPES.includes(contentType);
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({attachment, onView, onDownload, onDelete}) => {
  const image = isImage(attachment.contentType);

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {image ? (
        <CardMedia
          component="img"
          height={140}
          image={attachment.signedUrl}
          alt={attachment.fileName}
          sx={{objectFit: 'cover', cursor: onView ? 'pointer' : 'default'}}
          onClick={() => onView?.(attachment)}
        />
      ) : (
        <Box
          sx={{
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            cursor: onView ? 'pointer' : 'default',
          }}
          onClick={() => onView?.(attachment)}
        >
          <InsertDriveFileIcon sx={{fontSize: 64, color: 'text.secondary'}} />
        </Box>
      )}
      <CardContent sx={{flexGrow: 1, pb: '8px !important'}}>
        <Typography variant="body2" noWrap title={attachment.fileName}>
          {attachment.fileName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(attachment.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
      <Box sx={{display: 'flex', justifyContent: 'flex-end', px: 1, pb: 1}}>
        {onView && isImage(attachment.contentType) && (
          <Tooltip title="View">
            <IconButton size="small" onClick={() => onView(attachment)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDownload && (
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => onDownload(attachment)}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => onDelete(attachment)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
};
