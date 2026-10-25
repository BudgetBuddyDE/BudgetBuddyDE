'use client';

import {DashboardRounded, InsightsRounded} from '@mui/icons-material';
import {ToggleButton, ToggleButtonGroup} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import type React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {EntityIcon} from '@/lib/ibn';

export const DashboardViewMapping = {
  '/dashboard': {
    label: 'dashboard',
    description: 'dashboardDescription',
  },
  '/dashboard/budget': {
    label: 'budget',
    description: 'budgetDescription',
  },
  '/dashboard/insights': {
    label: 'insights',
    description: 'insightsDescription',
  },
} as const;

export const DashboardViewIconMapping: Record<keyof typeof DashboardViewMapping, React.ReactNode | undefined> = {
  '/dashboard': <DashboardRounded />,
  '/dashboard/budget': <EntityIcon entity="budget" />,
  '/dashboard/insights': <InsightsRounded />,
};

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type TDashboardNavigationProps = {};

export const DashboardNavigation: React.FC<TDashboardNavigationProps> = () => {
  const t = useTranslations('DashboardNavigation');
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
        {Object.keys(DashboardViewMapping).map(path => (
          <ToggleButton key={path} value={path}>
            {t(DashboardViewMapping[path as keyof typeof DashboardViewMapping].label)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ActionPaper>
  );
};
