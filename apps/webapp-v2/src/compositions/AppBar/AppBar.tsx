'use client';

import {ActionIcon, Anchor, Group, Tooltip} from '@mantine/core';
import {IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconMenu2} from '@tabler/icons-react';
import {Branding} from '@/components/Branding/Branding';
import {ThemeToggle} from '@/components/ThemeToggle/ThemeToggle';
import {UserAvatar} from '@/components/UserAvatar/UserAvatar';

interface AppBarProps {
  desktopCollapsed: boolean;
  mobileOpened: boolean;
  onToggleDesktop: () => void;
  onOpenMobile: () => void;
}

export function AppBar({desktopCollapsed, mobileOpened, onToggleDesktop, onOpenMobile}: AppBarProps) {
  const desktopLabel = desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  return (
    <Group h="100%" px={{base: 16, md: 24}} justify="space-between" wrap="nowrap">
      <Group gap="md" wrap="nowrap">
        <ActionIcon
          hiddenFrom="md"
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Open navigation"
          aria-expanded={mobileOpened}
          aria-controls={mobileOpened ? 'mobile-navigation' : undefined}
          onClick={onOpenMobile}
        >
          <IconMenu2 size={24} />
        </ActionIcon>
        <Tooltip label={desktopLabel}>
          <ActionIcon
            visibleFrom="md"
            variant="subtle"
            color="gray"
            size="lg"
            aria-label={desktopLabel}
            aria-expanded={!desktopCollapsed}
            aria-controls="desktop-navigation"
            onClick={onToggleDesktop}
          >
            {desktopCollapsed ? <IconLayoutSidebarLeftExpand size={24} /> : <IconLayoutSidebarLeftCollapse size={24} />}
          </ActionIcon>
        </Tooltip>
        <Group visibleFrom="md">
          <Branding />
        </Group>
      </Group>
      <Group gap="lg" wrap="nowrap">
        <Group visibleFrom="md" gap="lg">
          <Anchor href="https://budgetbuddy.dev" target="_blank" rel="noopener noreferrer" size="sm">
            Website
          </Anchor>
          <Anchor href="https://github.com/BudgetBuddyDE" target="_blank" rel="noopener noreferrer" size="sm">
            GitHub
          </Anchor>
        </Group>
        <ThemeToggle />
        <UserAvatar />
      </Group>
    </Group>
  );
}
