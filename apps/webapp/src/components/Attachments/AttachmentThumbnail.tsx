'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {ImageRounded} from '@mui/icons-material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import ImageNotSupportedRounded from '@mui/icons-material/ImageNotSupportedRounded';
import {alpha, Box, type BoxProps, Skeleton, Stack, Tooltip, Typography, useTheme} from '@mui/material';
import type React from 'react';
import {memo, useState} from 'react';
import {Card} from '@/components/Card';
import {Image} from '@/components/Image';
import {Formatter} from '@/utils/Formatter';
import {ActionButton} from './ActionButton';
import {Icon} from '../Icon';
import {PreviewPill} from './PreviewPill';

export type AttachmentActionProps = Omit<BoxProps, 'onClick'> & {
  attachment: TAttachmentWithUrl;
  onView?: (attachment: TAttachmentWithUrl) => void;
  onDownload?: (attachment: TAttachmentWithUrl) => void;
  onDelete?: (attachment: TAttachmentWithUrl) => void;
};

const AttachmentActions: React.FC<AttachmentActionProps> = ({attachment, onDownload, onDelete, ...boxProps}) => (
  <Box className="attachment-actions" {...boxProps}>
    {onDownload && (
      <ActionButton label="Download" onClick={() => onDownload(attachment)}>
        <DownloadRounded />
      </ActionButton>
    )}
    {onDelete && (
      <ActionButton label="Delete" onClick={() => onDelete(attachment)}>
        <DeleteRounded />
      </ActionButton>
    )}
  </Box>
);

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
  /**
   * When true the image is fetched with high priority (no lazy loading + preload link).
   * Pass this for items in the first visible row.
   */
  priority?: boolean;
};

/**
 * Displays a single attachment as a thumbnail card with a hover action bar
 * for viewing, downloading, and deleting the attachment.
 * Falls back to a placeholder when the image cannot be loaded.
 */
export const AttachmentThumbnail: React.FC<AttachmentThumbnailProps> = memo(
  ({attachment, onView, onDownload, onDelete, priority = false}) => {
    const theme = useTheme();
    const [imgError, setImgError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
      <Card
        sx={{
          position: 'relative',
          p: 0,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          '&:hover .attachment-preview, &:focus-within .attachment-preview': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        }}
      >
        <Box sx={{position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden'}}>
          {imgError ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.16)})`,
              }}
            >
              <ImageNotSupportedRounded color="disabled" sx={{fontSize: 40}} />
            </Box>
          ) : (
            <>
              {!imgLoaded && <Skeleton variant="rectangular" sx={{position: 'absolute', inset: 0, zIndex: 1}} />}
              <Image
                src={attachment.signedUrl}
                alt={attachment.fileName}
                fill
                priority={priority}
                sizes="(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw"
                loading={priority ? 'eager' : 'lazy'}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  objectFit: 'cover',
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                }}
              />
              <Box
                className="attachment-preview"
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  zIndex: 2,
                  opacity: 0,
                  transform: 'translateY(4px)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                }}
              >
                <PreviewPill attachment={attachment} onClick={onView} />
              </Box>
            </>
          )}
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.25} sx={{px: 1.5, py: 1.25, minWidth: 0}}>
          <Icon icon={<ImageRounded />} sx={{flex: '0 0 auto'}} />
          <Stack spacing={0.25} sx={{minWidth: 0, flex: 1}}>
            <Tooltip title={attachment.fileName}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {attachment.fileName}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="text.secondary" noWrap>
              {Formatter.date.format(attachment.createdAt, true)}
            </Typography>
          </Stack>
          {!imgError && (
            <AttachmentActions
              sx={{display: 'flex', alignItems: 'center', flex: '0 0 auto'}}
              attachment={attachment}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          )}
        </Stack>
      </Card>
    );
  },
);
