import {GitHub, Google} from '@mui/icons-material';
import {Button, type ButtonProps} from '@mui/material';
import React from 'react';

import {AppConfig, type TAppConfig} from '@/app.config.ts';
import {authClient} from '@/auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';

const IconMapping: Record<keyof TAppConfig['authProvider'], React.ReactNode> = {
  github: <GitHub />,
  google: <Google />,
};

export type TSocialSignInBtnProps = {
  provider: keyof TAppConfig['authProvider'];
} & Omit<ButtonProps, 'onClick'>;

export const SocialSignInBtn: React.FC<TSocialSignInBtnProps> = ({provider, ...buttonProps}) => {
  const {showSnackbar} = useSnackbarContext();
  return (
    <Button
      variant={'contained'}
      size={'large'}
      startIcon={IconMapping[provider]}
      onClick={async () => {
        try {
          const result = await authClient.signIn.social({
            provider: provider,
            requestSignUp: true,
            callbackURL: window.location.origin + '/dashboard', // Adjust the callback URL as needed
          });
          if (result.error) {
            logger.error('Something went wrong', result.error);
            showSnackbar({message: result.error.message || 'Authentication failed'});
          }
          showSnackbar({
            message: 'Authentication with ' + AppConfig.authProvider[provider] + ' successful! Redirecting...',
          });
        } catch (error) {
          logger.error('Something went wrong', error);
          showSnackbar({message: error instanceof Error ? error.message : 'Authentication failed'});
        }
      }}
      fullWidth
      {...buttonProps}>
      {AppConfig.authProvider[provider]}
    </Button>
  );
};
