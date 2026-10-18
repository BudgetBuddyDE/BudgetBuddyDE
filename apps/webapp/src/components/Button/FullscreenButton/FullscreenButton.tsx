'use client';

import {OpenInFullRounded, CloseFullscreenRounded} from '@mui/icons-material';
import {IconButton, type IconButtonProps} from '@mui/material';
import type React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type FullscreenIconButtonProps = Omit<IconButtonProps, 'children'> & {
  isFullscreen?: boolean;
};

export const FullscreenIconButton: React.FC<FullscreenIconButtonProps> = ({isFullscreen, ...props}) => {
  const t = useAppTranslations();
  return (
    <IconButton aria-label={isFullscreen ? t('common.exitFullscreen') : t('common.enterFullscreen')} {...props}>
      {isFullscreen ? <CloseFullscreenRounded /> : <OpenInFullRounded />}
    </IconButton>
  );
};
