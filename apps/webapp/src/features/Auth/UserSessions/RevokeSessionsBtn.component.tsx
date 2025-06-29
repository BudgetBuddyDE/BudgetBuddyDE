import {WarningRounded} from '@mui/icons-material';
import {Button, ButtonProps} from '@mui/material';
import React from 'react';

import {authClient} from '@/auth';
import {useSnackbarContext} from '@/features/Snackbar';

import {useAuthContext} from '../Auth.context';

export type TRevokeSessionsButtonProps = ButtonProps;

export const RevokeSessionsButton: React.FC<TRevokeSessionsButtonProps> = props => {
  const {showSnackbar} = useSnackbarContext();
  const {revalidateSession} = useAuthContext();
  return (
    <Button
      {...props}
      color="warning"
      startIcon={<WarningRounded />}
      onClick={async () => {
        const {data, error} = await authClient.revokeSessions();
        if (error) {
          console.error('Error revoking all sessions:', error);
        }

        await revalidateSession();
        showSnackbar({
          message: data?.status
            ? 'All sessions revoked successfully'
            : error?.message || 'Failed to revoke all sessions',
        });
      }}>
      Revoke all sessions
    </Button>
  );
};
