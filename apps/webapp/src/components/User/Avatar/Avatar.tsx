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

  const src = data.user.image ?? `/api/avatar?seed=${data.user.email}`;
  return <MuiAvatar src={src} variant={variant} {...props} sx={style} />;
};
