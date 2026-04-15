'use client';

import {type SxProps, styled, type Theme} from '@mui/material';
import NextImage, {type ImageProps} from 'next/image';

export type ImageComponentProps = Omit<ImageProps, 'alt' | 'width' | 'height'> & {
  alt?: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  sx?: SxProps<Theme>;
};

function NextImageBase({alt = '', width = 100, height = 100, ...props}: ImageComponentProps) {
  return <NextImage alt={alt} width={width} height={height} {...props} />;
}

export const Image = styled(NextImageBase)(({theme}) => ({
  borderRadius: `${theme.shape.borderRadius}px`,
  // objectFit: 'cover',
  // aspectRatio: '1 / 1',
}));
