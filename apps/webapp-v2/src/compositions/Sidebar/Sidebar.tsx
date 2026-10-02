'use client';

import {ActionIcon, Button, Group, Stack, Text, Tooltip, UnstyledButton} from '@mantine/core';
import {IconLogout, type TablerIcon} from '@tabler/icons-react';
import Link from 'next/link';
import {Branding} from '@/components/Branding/Branding';
import {UserAvatar} from '@/components/UserAvatar/UserAvatar';
import classes from './Sidebar.module.css';

export interface SidebarItem {
  label: string;
  href: string;
  icon: TablerIcon;
  active: boolean;
}

interface SidebarProps {
  items: readonly SidebarItem[];
  collapsed?: boolean;
  showBranding?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({items, collapsed = false, showBranding = true, onNavigate}: SidebarProps) {
  return (
    <div className={classes.root} data-collapsed={collapsed || undefined}>
      {showBranding && (
        <div className={classes.brand}>
          <Branding collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      )}
      <nav aria-label="Main navigation" className={classes.navigation}>
        <Stack gap={4}>
          {items.map(({label, href, icon: Icon, active}) => (
            <Tooltip key={href} label={label} disabled={!collapsed} position="right">
              <UnstyledButton
                component={Link}
                href={href}
                onClick={onNavigate}
                className={classes.link}
                data-active={active || undefined}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={22} aria-hidden="true" className={classes.icon} />
                {!collapsed && <span>{label}</span>}
              </UnstyledButton>
            </Tooltip>
          ))}
        </Stack>
      </nav>
      <Stack gap="sm" className={classes.user}>
        <Group gap="sm" wrap="nowrap" justify={collapsed ? 'center' : undefined}>
          <UserAvatar onNavigate={onNavigate} />
          {!collapsed && (
            <Text size="sm" fw={600}>
              User
            </Text>
          )}
        </Group>
        <Tooltip label="Authentication not connected" position={collapsed ? 'right' : 'top'}>
          <div>
            {collapsed ? (
              <ActionIcon disabled aria-label="Logout" size={40} variant="subtle">
                <IconLogout size={22} />
              </ActionIcon>
            ) : (
              <Button disabled fullWidth variant="subtle" leftSection={<IconLogout size={20} />}>
                Logout
              </Button>
            )}
          </div>
        </Tooltip>
        {!collapsed && (
          <Text size="xs" c="dimmed">
            Authentication not connected
          </Text>
        )}
      </Stack>
    </div>
  );
}
