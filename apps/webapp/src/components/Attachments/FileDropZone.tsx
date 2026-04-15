'use client';

import {CloudUploadRounded} from '@mui/icons-material';
import {alpha, Box, type BoxProps, CircularProgress, Typography, useTheme} from '@mui/material';
import type React from 'react';
import {useRef} from 'react';

/** Props for {@link FileDropZone}. */
export type FileDropZoneProps = Pick<BoxProps, 'sx'> & {
  /** Whether a file upload is currently in progress. Disables interaction when `true`. */
  isUploading: boolean;
  /** Whether the user is actively dragging files over the zone. */
  isDragging: boolean;
  /** Called with the selected or dropped files when the user initiates an upload. */
  onUpload: (files: File[]) => void;
  /** Called whenever the drag-over state changes. */
  onDraggingChange: (dragging: boolean) => void;
  /**
   * Value forwarded to the hidden `<input accept>` attribute.
   * Defaults to common image formats.
   */
  accept?: string;
};

/**
 * Generic drag-and-drop / click-to-upload zone.
 * Renders a styled drop target that accepts files via drag-and-drop or a
 * native file picker. Pass `accept` to restrict the allowed file types.
 */
export const FileDropZone: React.FC<FileDropZoneProps> = ({
  isUploading,
  isDragging,
  onUpload,
  onDraggingChange,
  accept = 'image/png,image/jpg,image/jpeg,image/webp',
  sx,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDraggingChange(false);
    onUpload(Array.from(event.dataTransfer.files));
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpload(Array.from(event.target.files ?? []));
    // Reset so the same file can be re-selected
    event.target.value = '';
  };

  return (
    <Box
      onDragOver={event => {
        event.preventDefault();
        onDraggingChange(true);
      }}
      onDragLeave={() => onDraggingChange(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      sx={{
        border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        textAlign: 'center',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        backgroundColor: isDragging ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': {
          backgroundColor: isUploading ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
        },
        ...sx,
      }}
    >
      {isUploading ? (
        <CircularProgress size={20} />
      ) : (
        <CloudUploadRounded fontSize="small" sx={{color: 'text.secondary'}} />
      )}
      <Typography variant="body2" color="text.secondary">
        {isUploading ? 'Uploading…' : 'Click or drag & drop files to upload'}
      </Typography>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        style={{display: 'none'}}
        onChange={handleFileInputChange}
        disabled={isUploading}
        data-testid="attachment-file-input"
      />
    </Box>
  );
};
