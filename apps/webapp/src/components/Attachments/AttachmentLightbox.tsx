'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {DownloadRounded} from '@mui/icons-material';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from '@mui/material';
import type React from 'react';
import {Image} from '@/components/Image';
import {ZoomTransition} from '@/components/Transition';

/** Props for {@link AttachmentLightbox}. */
export type AttachmentLightboxProps = {
  /** The attachment to display, or `null` to keep the dialog closed. */
  attachment: TAttachmentWithUrl | null;
  /** Called when the dialog should be closed. */
  onClose: () => void;
  /** Called when the user clicks the download button. */
  onDownload: (attachment: TAttachmentWithUrl) => void;
};

/**
 * Full-screen lightbox dialog that displays a single attachment image.
 * The dialog opens whenever `attachment` is non-null and closes via `onClose`.
 */
export const AttachmentLightbox: React.FC<AttachmentLightboxProps> = ({attachment, onClose, onDownload}) => {
  return (
    <Dialog
      open={attachment !== null}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slots={{transition: ZoomTransition}}
      slotProps={{paper: {elevation: 0}}}
    >
      <DialogTitle sx={{display: 'flex', alignItems: 'center'}}>
        <Typography variant="h6" component="span" noWrap sx={{flexGrow: 1, mr: 1}}>
          {attachment?.fileName}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{p: 1, textAlign: 'center'}}>
        {attachment && (
          <Image
            src={attachment.signedUrl}
            alt={attachment.fileName}
            width={1600}
            height={1200}
            unoptimized
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        {attachment && (
          <Button startIcon={<DownloadRounded />} onClick={() => onDownload(attachment)}>
            Download
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
