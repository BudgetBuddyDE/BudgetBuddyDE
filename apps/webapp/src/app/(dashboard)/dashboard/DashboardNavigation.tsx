'use client';

import {DashboardRounded, TrendingUpRounded} from '@mui/icons-material';
import {ToggleButton, ToggleButtonGroup} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import type React from 'react';
import {ActionPaper} from '@/components/ActionPaper';

export const DashboardViewMapping = {
  '/dashboard': {
    label: 'Dashboard',
    description: 'Overview of your dashboard',
  },
  '/dashboard/analytics': {
    label: 'Analytics',
    description: 'View analytics data',
  },
} as const;

export const DashboardViewIconMapping: Record<keyof typeof DashboardViewMapping, React.ReactNode | undefined> = {
  '/dashboard': <DashboardRounded />,
  '/dashboard/analytics': <TrendingUpRounded />,
};

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type TDashboardNavigationProps = {};

export const DashboardNavigation: React.FC<TDashboardNavigationProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <ActionPaper
      sx={{
        width: 'min-content',
        maxWidth: '100%',
        overflowX: 'scroll',
        '::-webkit-scrollbar': {
          display: 'none',
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <ToggleButtonGroup
        size="small"
        color="primary"
        value={pathname}
        onChange={(event: React.BaseSyntheticEvent) => {
          const newPath = event.target.value;
          if (pathname === newPath) return;
          router.push(newPath);
        }}
        exclusive
      >
        {Object.entries(DashboardViewMapping).map(([path, {label}]) => (
          <ToggleButton key={path} value={path}>
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ActionPaper>
  );
};
