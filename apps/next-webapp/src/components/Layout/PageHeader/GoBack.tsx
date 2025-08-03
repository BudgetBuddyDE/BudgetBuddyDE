'use client';

import { IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import React from 'react';
import { ArrowBackRounded } from '@mui/icons-material';

export type TGoBackProps = {
  withNavigation?: boolean;
  navigationPath?: string;
  big: boolean;
};

export const GoBack: React.FC<TGoBackProps> = ({ withNavigation, navigationPath, big }) => {
  const router = useRouter();
  return (
    <IconButton
      size="large"
      color="primary"
      {...(withNavigation && {
        component: NextLink,
        ...(navigationPath
          ? { href: navigationPath }
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
