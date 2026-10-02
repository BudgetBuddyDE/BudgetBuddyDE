import {Avatar, Tooltip} from '@mantine/core';
import {IconUser} from '@tabler/icons-react';
import Link from 'next/link';

interface UserAvatarProps {
  onNavigate?: () => void;
}

export function UserAvatar({onNavigate}: UserAvatarProps) {
  return (
    <Tooltip label="Profile">
      <Avatar
        component={Link}
        href="/settings/profile"
        onClick={onNavigate}
        aria-label="Profile"
        radius="xl"
        color="blue"
        size={36}
      >
        <IconUser size={20} aria-hidden="true" />
      </Avatar>
    </Tooltip>
  );
}
