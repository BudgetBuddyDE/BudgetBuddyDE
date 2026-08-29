'use client';

import {
  Avatar as MuiAvatar,
  type AvatarProps as MuiAvatarProps,
  Skeleton,
  type SxProps,
  type Theme,
} from '@mui/material';
import type React from 'react';
import {authClient} from '@/authClient';

export type TAvatarProps = MuiAvatarProps;

export const Avatar: React.FC<TAvatarProps> = props => {
  const {isPending, data} = authClient.useSession();
  const variant = props.variant ?? 'rounded';

  const style: SxProps<Theme> = {
    height: 'auto',
    aspectRatio: '1/1',
    ...props.sx,
  };
  if (isPending || !data) {
    return <Skeleton variant="rounded" sx={style} />;
  }

  const animatedStyle: SxProps<Theme> = {
    ...style,
    boxSizing: 'border-box',
    overflow: 'hidden',
    padding: '2px',
    background: theme =>
      `linear-gradient(120deg, ${theme.palette.primary.light}, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    backgroundSize: '300% 300%',
    animation: 'avatar-border-flow 3.5s ease infinite',
    '@keyframes avatar-border-flow': {
      '0%, 100%': {
        backgroundPosition: '0% 50%',
      },
      '50%': {
        backgroundPosition: '100% 50%',
      },
    },
    '& .MuiAvatar-img': {
      borderRadius:
        variant === 'circular'
          ? '50%'
          : variant === 'square'
            ? 0
            : theme => {
                const {borderRadius} = theme.shape;
                return typeof borderRadius === 'number'
                  ? `${Math.max(borderRadius - 2, 0)}px`
                  : `max(calc(${borderRadius} - 2px), 0px)`;
              },
    },
  };

  const src = data.user.image ?? `/api/avatar?seed=${data.user.email}`;
  return <MuiAvatar src={src} variant={variant} {...props} sx={animatedStyle} />;
};
