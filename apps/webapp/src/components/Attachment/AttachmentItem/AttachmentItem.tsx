'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {DeleteRounded, DownloadRounded, InsertDriveFileRounded} from '@mui/icons-material';
import {Box, type BoxProps, CircularProgress, IconButton, Stack, Tooltip, Typography, useTheme} from '@mui/material';
import type React from 'react';
import {formatBytes} from '@/utils/formatBytes';

export type AttachmentItemProps = {
  attachment: TAttachmentWithUrl;
  onDelete?: (attachment: TAttachmentWithUrl) => void | Promise<void>;
  isDeleting?: boolean;
} & Pick<BoxProps, 'sx'>;

const IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

export const AttachmentItem: React.FC<AttachmentItemProps> = ({attachment, onDelete, isDeleting = false, sx}) => {
  const theme = useTheme();
  const isImage = IMAGE_TYPES.includes(attachment.contentType);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = attachment.signedUrl;
    a.download = attachment.fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  return (
    <Box
      data-testid="attachment-item"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: `${theme.shape.borderRadius}px`,
        backgroundColor: theme.palette.action.hover,
        ...sx,
      }}
    >
      {isImage ? (
        <Box
          component="img"
          src={attachment.signedUrl}
          alt={attachment.fileName}
          sx={{
            width: 48,
            height: 48,
            objectFit: 'cover',
            borderRadius: `${theme.shape.borderRadius}px`,
            flexShrink: 0,
            cursor: 'pointer',
          }}
          onClick={() => window.open(attachment.signedUrl, '_blank', 'noopener,noreferrer')}
        />
      ) : (
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.action.selected,
            borderRadius: `${theme.shape.borderRadius}px`,
            flexShrink: 0,
          }}
        >
          <InsertDriveFileRounded color="action" />
        </Box>
      )}

      <Stack flexGrow={1} overflow="hidden">
        <Typography variant="body2" fontWeight="medium" noWrap title={attachment.fileName}>
          {attachment.fileName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(attachment.createdAt).toLocaleDateString()}
          {attachment.fileSize ? ` · ${formatBytes(attachment.fileSize)}` : ''}
        </Typography>
      </Stack>

      <Stack direction="row" gap={0.5} flexShrink={0}>
        <Tooltip title="Download">
          <IconButton size="small" onClick={handleDownload} aria-label="download attachment">
            <DownloadRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        {onDelete && (
          <Tooltip title="Delete">
            <span>
              <IconButton
                size="small"
                onClick={() => onDelete(attachment)}
                disabled={isDeleting}
                aria-label="delete attachment"
              >
                {isDeleting ? <CircularProgress size={16} /> : <DeleteRounded fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};
