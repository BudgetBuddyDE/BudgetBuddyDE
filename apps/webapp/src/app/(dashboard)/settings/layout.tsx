'use client';

import {Grid} from '@mui/material';
import React from 'react';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {ProfileHeader} from '@/components/User/ProfileHeader';

export default function SettingsLayout({children}: React.PropsWithChildren) {
  return (
    <ContentGrid title="Settings" description="Manage your account settings">
      <Grid size={{xs: 12}}>
        <ProfileHeader />
      </Grid>

      <Grid size="grow">{children}</Grid>
    </ContentGrid>
  );
}
