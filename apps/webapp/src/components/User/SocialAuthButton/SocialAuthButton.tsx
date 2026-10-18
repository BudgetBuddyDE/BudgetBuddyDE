'use client';

import GitHub from '@mui/icons-material/GitHub';
import Google from '@mui/icons-material/Google';
import {Button, type ButtonProps} from '@mui/material';
import type React from 'react';
import {authClient} from '@/authClient';
import {useSnackbarContext} from '@/components/Snackbar';
import {useAppTranslations} from '@/hooks/useAppTranslations';
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
  const t = useAppTranslations();
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
        message: t('account.linkedAccounts.authenticationWithValue1SuccessfulRedirecting', {
          value1: NameMapping[provider],
        }),
      });
    } catch (error) {
      if (error instanceof Error) logger.error('Social authentication failed', error);
      else logger.error('Social authentication failed', {reason: String(error)});
      showSnackbar({
        message: error instanceof Error ? error.message : t('account.linkedAccounts.authenticationFailed'),
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
