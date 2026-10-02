import {Avatar} from '@mantine/core';
import {IconUser} from '@tabler/icons-react';

export function UserAvatar() {
  return (
    <Avatar radius="md" color="blue" size={36}>
      <IconUser size={20} aria-hidden="true" />
    </Avatar>
  );
}
