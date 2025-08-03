'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ActionPaper } from '@/components/ActionPaper';
import { DashboardRounded, TrendingUpRounded } from '@mui/icons-material';

export const DashboardViewMapping = {
  '/dashboard': {
    label: 'Dashboard',
    description: 'Overview of your dashboard',
  },
  '/dashboard/analytics': {
    label: 'Analytics',
    description: 'View analytics data',
  },
  '/dashboard/stocks': {
    label: 'Stocks',
    description: 'Manage your stock portfolio',
  },
} as const;

export const DashboardViewIconMapping: Record<
  keyof typeof DashboardViewMapping,
  React.ReactNode | undefined
> = {
  ['/dashboard']: <DashboardRounded />,
  ['/dashboard/analytics']: <TrendingUpRounded />,
  ['/dashboard/stocks']: <TrendingUpRounded />,
};

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
        {Object.entries(DashboardViewMapping).map(([path, { label }]) => (
          <ToggleButton key={path} value={path}>
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ActionPaper>
  );
};
