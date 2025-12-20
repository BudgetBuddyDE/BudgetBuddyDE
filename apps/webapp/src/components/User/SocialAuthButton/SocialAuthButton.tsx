'use client';

import {GitHub, Google} from '@mui/icons-material';
import {Button, type ButtonProps} from '@mui/material';
import type React from 'react';
import {authClient} from '@/authClient';
import {useSnackbarContext} from '@/components/Snackbar';
import {logger} from '@/logger';

export type AuthProvider = 'github' | 'google';

const NameMapping: Record<AuthProvider, string> = {
  github: 'GitHub',
  google: 'Google',
};

const IconMapping: Record<AuthProvider, React.ReactNode> = {
  github: <GitHub />,
  google: <Google />,
};

export type SocialAuthButton = {
  provider: AuthProvider;
} & Omit<ButtonProps, 'onClick'>;

export const SocialAuthButton: React.FC<SocialAuthButton> = ({provider, ...buttonProps}) => {
  const {showSnackbar} = useSnackbarContext();

  const handleClick = async () => {
    try {
      const result = await authClient.signIn.social({
        provider: provider,
        requestSignUp: true,
        callbackURL: `${window.location.origin}/dashboard`,
      });
      if (result.error) throw result.error;

      showSnackbar({
        message: `Authentication with ${NameMapping[provider]} successful! Redirecting...`,
      });
    } catch (error) {
      logger.error('Something went wrong', error);
      showSnackbar({
        message: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };
  return (
    <Button
      variant={'contained'}
      size={'large'}
      startIcon={IconMapping[provider]}
      onClick={handleClick}
      fullWidth
      {...buttonProps}
    >
      {NameMapping[provider]}
    </Button>
  );
};
