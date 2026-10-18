'use client';

import type {SxProps, Theme} from '@mui/material';
import {useColorScheme} from '@mui/material/styles';
import type React from 'react';

import type {ImageComponentProps} from '@/components/Image';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {Image} from '../Image';

export type TAppLogoProps = Omit<ImageComponentProps, 'src'> & {sx?: SxProps<Theme>};

export const AppLogo: React.FC<TAppLogoProps> = ({sx, ...imageProps}) => {
  const {mode} = useColorScheme();
  const t = useAppTranslations();

  return (
    <Image
      src={mode === 'light' ? '/mobile-logo-dark.svg' : '/mobile-logo-light.svg'}
      alt={t('common.budgetbuddyLogo')}
      {...imageProps}
      sx={{
        width: '6rem',
        height: 'auto',
        aspectRatio: '1/1',
        ...sx,
      }}
    />
  );
};
