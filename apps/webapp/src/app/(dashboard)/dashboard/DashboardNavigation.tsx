'use client';

import {DashboardRounded, InsightsRounded} from '@mui/icons-material';
import {ToggleButton, ToggleButtonGroup} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import type React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import type {AppTranslator} from '@/lib/i18n/translate';
import {EntityIcon} from '@/lib/ibn';

export const getDashboardViewMapping = (t: AppTranslator) =>
  ({
    '/dashboard': {
      label: t('Dashboard'),
      description: t('Overview of your dashboard'),
    },
    '/dashboard/budget': {
      label: t('Budget'),
      description: t('All about your monthly budget'),
    },
    '/dashboard/insights': {
      label: t('Insights'),
      description: t('Insights into your data'),
    },
  }) as const;

export const DashboardViewMapping = getDashboardViewMapping(source => source);

export const DashboardViewIconMapping: Record<keyof typeof DashboardViewMapping, React.ReactNode | undefined> = {
  '/dashboard': <DashboardRounded />,
  '/dashboard/budget': <EntityIcon entity="budget" />,
  '/dashboard/insights': <InsightsRounded />,
};

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type TDashboardNavigationProps = {};

export const DashboardNavigation: React.FC<TDashboardNavigationProps> = () => {
  const t = useAppTranslations();
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
        {Object.entries(getDashboardViewMapping(t)).map(([path, {label}]) => (
          <ToggleButton key={path} value={path}>
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ActionPaper>
  );
};
