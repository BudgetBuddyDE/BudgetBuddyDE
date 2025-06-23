import {Avatar as MuiAvatar, type AvatarProps as MuiAvatarProps} from '@mui/material';
import React from 'react';

import {useAuthContext} from '@/features/Auth';

export type TUserAvatarProps = MuiAvatarProps;

export const UserAvatar: React.FC<TUserAvatarProps> = props => {
  const {session} = useAuthContext();

  if (!session) return null;
  const userAvatar = session.user.image;
  if (userAvatar) {
    return (
      <MuiAvatar
        src={userAvatar}
        {...props}
        variant="rounded"
        {...props}
        sx={{height: 'auto', aspectRatio: '1/1', ...props.sx}}
      />
    );
  }
  return (
    <MuiAvatar variant="rounded" {...props} sx={{height: 'auto', aspectRatio: '1/1', ...props.sx}}>
      {session.user.name.substring(0, 2).toUpperCase()}
    </MuiAvatar>
  );
};
