'use client';

import {type SxProps, styled, type Theme} from '@mui/material';
import NextImage, {type ImageProps} from 'next/image';

export type ImageComponentProps = Omit<ImageProps, 'alt' | 'width' | 'height'> & {
  alt?: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  sx?: SxProps<Theme>;
};

function NextImageBase({alt = '', width, height, fill, ...props}: ImageComponentProps) {
  if (fill) return <NextImage alt={alt} fill {...props} />;

  return <NextImage alt={alt} width={width ?? 100} height={height ?? 100} {...props} />;
}

export const Image = styled(NextImageBase)(({theme}) => ({
  borderRadius: `${theme.shape.borderRadius}px`,
  // objectFit: 'cover',
  // aspectRatio: '1 / 1',
}));
