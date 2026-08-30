'use client';

import {OpenInFullRounded, CloseFullscreenRounded} from '@mui/icons-material';
import {IconButton, type IconButtonProps} from '@mui/material';
import type React from 'react';

export type FullscreenIconButtonProps = Omit<IconButtonProps, 'children'> & {
  isFullscreen?: boolean;
};

export const FullscreenIconButton: React.FC<FullscreenIconButtonProps> = ({isFullscreen, ...props}) => {
  return (
    <IconButton aria-label={isFullscreen ? 'exit fullscreen' : 'enter fullscreen'} {...props}>
      {isFullscreen ? <CloseFullscreenRounded /> : <OpenInFullRounded />}
    </IconButton>
  );
};
