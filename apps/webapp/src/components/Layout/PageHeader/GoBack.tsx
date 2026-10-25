'use client';

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import {IconButton} from '@mui/material';
import NextLink from 'next/link';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import type React from 'react';

export type TGoBackProps = {
  withNavigation?: boolean;
  navigationPath?: string;
  big: boolean;
};

export const GoBack: React.FC<TGoBackProps> = ({withNavigation, navigationPath, big}) => {
  const t = useTranslations('Navigation');
  const router = useRouter();
  return (
    <IconButton
      size="large"
      color="primary"
      aria-label={t('goBack')}
      {...(withNavigation && {
        component: NextLink,
        ...(navigationPath
          ? {href: navigationPath}
          : {
              onClick: () => {
                router.back();
              },
            }),
      })}
      sx={{
        aspectRatio: '1/1',
        width: 'auto',
        height: big ? '4rem' : '2rem',
      }}
    >
      <ArrowBackRounded />
    </IconButton>
  );
};
