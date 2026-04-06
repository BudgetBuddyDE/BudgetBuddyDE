'use client';

import {CloudUploadRounded} from '@mui/icons-material';
import {Box, Button, type ButtonProps, CircularProgress, Stack, Typography, useTheme} from '@mui/material';
import React from 'react';

const ACCEPTED_TYPES = 'image/png,image/jpg,image/jpeg,image/webp';

export type AttachmentUploaderProps = {
  onUpload: (files: File[]) => void | Promise<void>;
  isUploading?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  buttonProps?: Omit<ButtonProps, 'onClick' | 'disabled'>;
};

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  onUpload,
  isUploading = false,
  disabled = false,
  maxFiles,
  buttonProps,
}) => {
  const theme = useTheme();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const limited = maxFiles ? files.slice(0, maxFiles) : files;
    onUpload(limited);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // reset so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="attachment-uploader"
      sx={{
        border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        p: 2,
        textAlign: 'center',
        transition: 'border-color 0.2s',
        backgroundColor: isDragging ? theme.palette.action.hover : 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple={!maxFiles || maxFiles > 1}
        style={{display: 'none'}}
        onChange={handleChange}
        data-testid="attachment-file-input"
        aria-label="Upload attachment files"
      />
      <Stack alignItems="center" gap={1}>
        {isUploading ? (
          <CircularProgress size={32} />
        ) : (
          <CloudUploadRounded sx={{fontSize: 32, color: theme.palette.text.secondary}} />
        )}
        <Typography variant="body2" color="text.secondary">
          {isUploading ? 'Uploading…' : 'Drag & drop images here or'}
        </Typography>
        {!isUploading && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            {...buttonProps}
          >
            Browse files
          </Button>
        )}
        <Typography variant="caption" color="text.secondary">
          Supported: PNG, JPG, JPEG, WebP
        </Typography>
      </Stack>
    </Box>
  );
};
