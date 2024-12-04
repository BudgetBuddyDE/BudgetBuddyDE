import {DeleteRounded} from '@mui/icons-material';
import {Avatar, type AvatarProps, Box, IconButton} from '@mui/material';
import React from 'react';

export type TFileUploadPreview = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  location?: string;
  buffer: string | ArrayBuffer | null;
};

export type TFileUploadPreviewProps = TFileUploadPreview &
  AvatarProps & {
    onDelete?: (file: TFileUploadPreview) => void;
  };

export const FileUploadPreview: React.FC<TFileUploadPreviewProps> = ({
  fileName,
  fileSize,
  mimeType,
  location,
  buffer,
  onDelete,
  ...avatarProps
}) => {
  const PreviewImage = () => {
    return (
      <Avatar
        variant="rounded"
        alt={'Image ' + fileName}
        src={location ? location : buffer ? buffer.toString() : undefined}
        {...avatarProps}
        sx={{
          width: '100%',
          height: 'auto',
          aspectRatio: '1/1',
          border: '1px solid',
          borderColor: 'action.disabled',
          color: 'action.disabled',
          ':hover': {
            borderColor: 'primary.main',
            color: 'primary.main',
          },
          ...avatarProps.sx,
        }}
      />
    );
  };
  if (onDelete) {
    return (
      <Box sx={{position: 'relative'}}>
        <PreviewImage />
        <IconButton
          aria-label="delete"
          onClick={() => onDelete({fileName, fileSize, mimeType, location, buffer})}
          sx={{
            position: 'absolute',
            inset: 0,
            border: '1px solid',
            borderColor: 'action.disabled',
            color: 'action.disabled',
            ':hover': {
              color: 'primary.main',
              borderColor: 'primary.main',
            },
          }}>
          <DeleteRounded />
        </IconButton>
      </Box>
    );
  }
  return <PreviewImage />;
};
