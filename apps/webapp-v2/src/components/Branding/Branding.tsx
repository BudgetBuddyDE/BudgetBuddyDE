import {Group, Text, ThemeIcon} from '@mantine/core';
import {IconPigMoney} from '@tabler/icons-react';
import Link from 'next/link';

interface BrandingProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Branding({collapsed = false, onNavigate}: BrandingProps) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      aria-label="BudgetBuddyDE dashboard"
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={36} radius="md" variant="light" color="blue">
          <IconPigMoney size={24} aria-hidden="true" />
        </ThemeIcon>
        {!collapsed && (
          <Text fw={700} size="lg">
            BudgetBuddyDE
          </Text>
        )}
      </Group>
    </Link>
  );
}
