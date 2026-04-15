import type {SxProps, Theme} from '@mui/material';
import type React from 'react';

import type {ImageComponentProps} from '@/components/Image';
import {Image} from '../Image';

export type TAppLogoProps = Omit<ImageComponentProps, 'src'> & {sx?: SxProps<Theme>};

export const AppLogo: React.FC<TAppLogoProps> = ({sx, ...imageProps}) => {
  return (
    <Image
      src="/logo.png"
      alt="BudgetBuddy Logo"
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
