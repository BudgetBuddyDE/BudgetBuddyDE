import {PocketBaseCollection} from '@budgetbuddyde/types';
import {GitHub, Google} from '@mui/icons-material';
import {Button, type ButtonProps} from '@mui/material';
import {RecordAuthResponse, RecordModel} from 'pocketbase';
import React from 'react';

import {AppConfig, type TAppConfig} from '@/app.config.ts';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {pb} from '@/pocketbase.ts';

const IconMapping: Record<keyof TAppConfig['authProvider'], React.ReactNode> = {
  github: <GitHub />,
  google: <Google />,
};

export type TSocialSignInBtnProps = {
  provider: keyof TAppConfig['authProvider'];
  onAuthProviderResponse: (data: RecordAuthResponse<RecordModel>) => void;
} & Omit<ButtonProps, 'onClick'>;

export const SocialSignInBtn: React.FC<TSocialSignInBtnProps> = ({
  provider,
  onAuthProviderResponse,
  ...buttonProps
}) => {
  const {showSnackbar} = useSnackbarContext();
  return (
    <Button
      variant={'contained'}
      size={'large'}
      startIcon={IconMapping[provider]}
      onClick={async () => {
        try {
          const result = await pb.collection(PocketBaseCollection.USERS).authWithOAuth2({provider});
          onAuthProviderResponse(result);
        } catch (error) {
          logger.error("Something wen't wrong", error);
          showSnackbar({message: error instanceof Error ? error.message : 'Authentication failed'});
        }
      }}
      fullWidth
      {...buttonProps}>
      {AppConfig.authProvider[provider]}
    </Button>
  );
};
