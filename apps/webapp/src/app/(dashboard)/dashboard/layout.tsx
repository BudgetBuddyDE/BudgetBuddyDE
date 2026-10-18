'use client';

import {Grid} from '@mui/material';
import {usePathname} from 'next/navigation';
import type React from 'react';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {DashboardNavigation, getDashboardViewMapping} from './DashboardNavigation';

export default function DashboardLayout({children}: React.PropsWithChildren) {
  const t = useAppTranslations();
  const views = getDashboardViewMapping(t);
  const pathname = usePathname() as keyof typeof views;
  const currentView = views[pathname] || {
    label: t('navigation.dashboard'),
    description: t('navigation.welcomeToYourDashboard'),
  };

  return (
    <ContentGrid title={currentView.label} description={currentView.description}>
      <Grid size={{xs: 12}}>
        <DashboardNavigation />
      </Grid>

      {children}
    </ContentGrid>
  );
}
