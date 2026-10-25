'use client';

import {Grid} from '@mui/material';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import type React from 'react';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {DashboardNavigation, DashboardViewMapping} from './DashboardNavigation';

export default function DashboardLayout({children}: React.PropsWithChildren) {
  const t = useTranslations('DashboardNavigation');
  const pathname = usePathname() as keyof typeof DashboardViewMapping;
  const view = DashboardViewMapping[pathname] ?? DashboardViewMapping['/dashboard'];
  const currentView = {label: t(view.label), description: t(view.description)};

  return (
    <ContentGrid title={currentView.label} description={currentView.description} transitionKey={pathname}>
      <Grid size={{xs: 12}}>
        <DashboardNavigation />
      </Grid>

      {children}
    </ContentGrid>
  );
}
