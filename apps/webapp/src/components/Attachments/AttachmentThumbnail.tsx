'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {DeleteRounded, DownloadRounded, ImageNotSupportedRounded, VisibilityRounded} from '@mui/icons-material';
import {
  alpha,
  Box,
  type BoxProps,
  IconButton,
  Stack,
  type SxProps,
  type Theme,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import type React from 'react';
import {useState} from 'react';
import {Card} from '@/components/Card';
import {Image} from '@/components/Image';
import {Formatter} from '@/utils/Formatter';

export type AttachmentActionProps = Omit<BoxProps, 'onClick'> & {
  attachment: TAttachmentWithUrl;
  onView?: (attachment: TAttachmentWithUrl) => void;
  onDownload?: (attachment: TAttachmentWithUrl) => void;
  onDelete?: (attachment: TAttachmentWithUrl) => void;
};

const AttachmentActions: React.FC<AttachmentActionProps> = ({
  attachment,
  onView,
  onDownload,
  onDelete,
  ...boxProps
}) => {
  return (
    <Box className={'attachment-actions'} {...boxProps}>
      {onView && (
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(attachment)} sx={{color: 'white'}}>
            <VisibilityRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onDownload && (
        <Tooltip title="Download">
          <IconButton size="small" onClick={() => onDownload(attachment)} sx={{color: 'white'}}>
            <DownloadRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(attachment)} sx={{color: 'white'}}>
            <DeleteRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

/** Props for {@link AttachmentThumbnail}. */
export type AttachmentThumbnailProps = {
  /** The attachment to display. */
  attachment: TAttachmentWithUrl;
  /** Called when the user clicks the view action to open the lightbox. */
  onView: (attachment: TAttachmentWithUrl) => void;
  /** Called when the user clicks the download action. */
  onDownload: (attachment: TAttachmentWithUrl) => void;
  /** Called when the user clicks the delete action. */
  onDelete: (attachment: TAttachmentWithUrl) => void;
};

/**
 * Displays a single attachment as a thumbnail card with a hover action bar
 * for viewing, downloading, and deleting the attachment.
 * Falls back to a placeholder when the image cannot be loaded.
 */
export const AttachmentThumbnail: React.FC<AttachmentThumbnailProps> = ({attachment, onView, onDownload, onDelete}) => {
  const theme = useTheme();
  const [imgError, setImgError] = useState(false);

  const ImageContainerSx: SxProps<Theme> = {
    width: '100%',
    height: 132,
    borderRadius: 2,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  };

  return (
    <Card sx={{position: 'relative', p: 0, '&:hover .attachment-actions': {opacity: 1, transform: 'translateY(0)'}}}>
      <Card.Header>
        {imgError ? (
          <Box
            sx={{
              ...ImageContainerSx,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.16)})`,
            }}
          >
            <ImageNotSupportedRounded color="disabled" />
          </Box>
        ) : (
          <Box sx={{position: 'relative', ...ImageContainerSx}}>
            <Image
              src={attachment.signedUrl}
              alt={attachment.fileName}
              fill
              unoptimized
              sizes="(max-width: 600px) 50vw, 33vw"
              loading="lazy"
              onError={() => setImgError(true)}
              style={{objectFit: 'cover'}}
            />
          </Box>
        )}
      </Card.Header>
      <Card.Body>
        <Stack>
          <Tooltip title={attachment.fileName}>
            <Typography variant="caption" noWrap sx={{px: 1, color: 'text.primary'}}>
              {attachment.fileName}
            </Typography>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{px: 1, pb: 1}}>
            {Formatter.date.format(attachment.createdAt, true)} • {attachment.fileExtension.toUpperCase()}
          </Typography>
        </Stack>
      </Card.Body>
      <Card.Footer>
        {!imgError && (
          <AttachmentActions
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              opacity: 0,
              transform: 'translateY(-4px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              backgroundColor: alpha(theme.palette.common.black, 0.56),
              backdropFilter: 'blur(10px)',
              borderRadius: 1,
              px: 0.5,
              py: 0.25,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
            attachment={attachment}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        )}
      </Card.Footer>
    </Card>
  );
};
