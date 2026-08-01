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

  const style: SxProps<Theme> = {
    height: 'auto',
    aspectRatio: '1/1',
    ...props.sx,
  };
  if (isPending || !data) {
    return <Skeleton variant="rounded" sx={style} />;
  }

  if (data.user.image) {
    return <MuiAvatar src={data.user.image} variant="rounded" {...props} sx={style} />;
  }
  return <MuiAvatar src={`/api/avatar?seed=${data.user.email}`} variant="rounded" {...props} sx={style} />;
};
