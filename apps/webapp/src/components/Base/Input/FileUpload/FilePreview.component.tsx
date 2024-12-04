import {DeleteRounded} from '@mui/icons-material';
import {Avatar, type AvatarProps, Box, IconButton} from '@mui/material';
import React from 'react';

export type TFilePreview = {
  fileName: string;
  fileUrl: string;
};

export type TFilePreviewProps = TFilePreview &
  AvatarProps & {
    onDelete?: (file: TFilePreview) => void;
  };

export const FilePreview: React.FC<TFilePreviewProps> = ({fileName, fileUrl, onDelete, ...avatarProps}) => {
  const PreviewImage = () => {
    return (
      <Avatar
        variant="rounded"
        alt={'Image ' + fileName}
        src={fileUrl}
        {...avatarProps}
        sx={{
          width: '100%',
          height: 'auto',
          aspectRatio: '1/1',
          border: '1px solid',
          borderColor: 'action.disabled',
          color: 'action.disabled',
          ':hover': {
            borderColor: 'action.active',
            color: 'action.active',
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
          onClick={() => onDelete({fileName, fileUrl})}
          sx={{
            position: 'absolute',
            inset: 0,
            border: '1px solid',
            borderColor: 'action.disabled',
            color: 'action.disabled',
            ':hover': {
              color: 'action.active',
              borderColor: 'action.active',
            },
          }}>
          <DeleteRounded />
        </IconButton>
      </Box>
    );
  }
  return <PreviewImage />;
};
