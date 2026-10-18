'use client';

import {Grid} from '@mui/material';
import React from 'react';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {ProfileHeader} from '@/components/User/ProfileHeader';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export default function SettingsLayout({children}: React.PropsWithChildren) {
  const t = useAppTranslations();
  return (
    <ContentGrid title={t('settings.settings')} description={t('settings.manageYourAccountSettings')}>
      <Grid size={{xs: 12}}>
        <ProfileHeader />
      </Grid>

      <Grid size="grow">{children}</Grid>
    </ContentGrid>
  );
}
