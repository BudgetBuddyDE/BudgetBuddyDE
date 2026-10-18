'use client';

import WarningRounded from '@mui/icons-material/WarningRounded';
import {Button, type ButtonProps, Skeleton} from '@mui/material';
import type React from 'react';
import {authClient, revalidateSession} from '@/authClient';
import {useSnackbarContext} from '@/components/Snackbar';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {logger} from '@/logger';

export type RevokeSessionsButtonProps = ButtonProps;

export const RevokeSessionsButton: React.FC<RevokeSessionsButtonProps> = props => {
  const t = useAppTranslations();
  const {isPending} = authClient.useSession();
  const {showSnackbar} = useSnackbarContext();

  if (isPending) {
    return <Skeleton variant="rounded" width={200} height={36} />;
  }

  const handleSessionRevoke = async () => {
    const {error} = await authClient.revokeSessions();
    if (error) {
      logger.error('Error revoking all sessions', {reason: error.message});
      showSnackbar({
        message: error.message || t('Failed to revoke all sessions'),
      });
    }

    await revalidateSession();
    const msg = 'All active sessions have been revoked!';
    logger.info(msg);
    showSnackbar({message: t('All active sessions have been revoked!')});
  };

  return (
    <Button {...props} color="warning" startIcon={<WarningRounded />} onClick={handleSessionRevoke}>
      {t('Revoke all sessions')}
    </Button>
  );
};
