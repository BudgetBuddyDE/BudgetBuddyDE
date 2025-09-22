'use client';

import React from 'react';
import { Grid } from '@mui/material';
import { ContentGrid } from '@/components/Layout/ContentGrid';
import { DashboardNavigation, DashboardViewMapping } from './DashboardNavigation';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: React.PropsWithChildren) {
  const pathname = usePathname() as keyof typeof DashboardViewMapping;
  const currentView = DashboardViewMapping[pathname] || {
    label: 'Dashboard',
    description: 'Welcome to your dashboard!',
  };
  
  return (
    <ContentGrid title={currentView.label} description={currentView.description}>
      <Grid size={{ xs: 12 }}>
        <DashboardNavigation />
      </Grid>

      {children}
    </ContentGrid>
  );
}
