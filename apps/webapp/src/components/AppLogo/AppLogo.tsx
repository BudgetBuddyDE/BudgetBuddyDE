import type {SxProps, Theme} from '@mui/material';
import type React from 'react';

import {Image} from '../Image';

export type TAppLogoProps = React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & {
  sx?: SxProps<Theme>;
};

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
