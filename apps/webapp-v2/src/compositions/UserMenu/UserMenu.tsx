'use client';

import {Menu, Text, UnstyledButton} from '@mantine/core';
import {IconLogout, IconSettings} from '@tabler/icons-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {UserAvatar} from '@/components/UserAvatar/UserAvatar';

export function UserMenu() {
  const pathname = usePathname();

  return (
    <Menu
      key={pathname}
      trigger="click-hover"
      openDelay={100}
      closeDelay={400}
      position="bottom-end"
      width={220}
      shadow="md"
    >
      <Menu.Target>
        <UnstyledButton aria-label="User menu" style={{borderRadius: 'var(--mantine-radius-md)'}}>
          <UserAvatar />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          component={Link}
          href="/settings/profile"
          leftSection={<IconSettings size={18} aria-hidden="true" />}
        >
          Settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled leftSection={<IconLogout size={18} aria-hidden="true" />}>
          Logout
        </Menu.Item>
        <Text size="xs" c="dimmed" px="sm" py={4}>
          Authentication not connected
        </Text>
      </Menu.Dropdown>
    </Menu>
  );
}
