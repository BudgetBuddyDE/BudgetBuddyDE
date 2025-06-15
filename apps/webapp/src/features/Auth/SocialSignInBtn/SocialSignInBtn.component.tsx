import {PocketBaseCollection} from '@budgetbuddyde/types';
import {GitHub, Google} from '@mui/icons-material';
import {Button, type ButtonProps} from '@mui/material';
import {RecordAuthResponse, RecordModel} from 'pocketbase';
import React from 'react';

import {AppConfig} from '@/app.config.ts';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {pb} from '@/pocketbase.ts';
import {type TExternalAuthProvider} from '@/services/Auth/types';

const IconMapping: Record<TExternalAuthProvider, React.ReactNode> = {
  github: <GitHub />,
  google: <Google />,
};

export type TSocialSignInBtnProps = {
  provider: TExternalAuthProvider;
  onAuthProviderResponse?: (data: RecordAuthResponse<RecordModel>) => void;
} & ButtonProps;

export const SocialSignInBtn: React.FC<TSocialSignInBtnProps> = ({
  provider,
  onAuthProviderResponse,
  ...buttonProps
}) => {
  const {showSnackbar} = useSnackbarContext();

  const handleOnClick = buttonProps.onClick
    ? buttonProps.onClick
    : async () => {
        try {
          const result = await pb.collection(PocketBaseCollection.USERS).authWithOAuth2({provider});
          onAuthProviderResponse?.(result);
        } catch (error) {
          logger.error("Something wen't wrong", error);
          showSnackbar({message: error instanceof Error ? error.message : 'Authentication failed'});
        }
      };

  return (
    <Button
      variant={'contained'}
      size={'large'}
      startIcon={IconMapping[provider]}
      onClick={handleOnClick}
      fullWidth
      {...buttonProps}>
      {AppConfig.authProvider[provider]}
    </Button>
  );
};
