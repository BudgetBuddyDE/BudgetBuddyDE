'use client';

import {Grid} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {ProfileHeader} from '@/components/User/ProfileHeader';

export default function SettingsLayout({children}: React.PropsWithChildren) {
  const t = useTranslations('Settings');
  return (
    <ContentGrid title={t('title')} description={t('description')}>
      <Grid size={{xs: 12}}>
        <ProfileHeader />
      </Grid>

      <Grid size="grow">{children}</Grid>
    </ContentGrid>
  );
}
