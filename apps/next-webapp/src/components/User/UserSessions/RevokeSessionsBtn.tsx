'use client';

import { authClient, revalidateSession } from '@/authClient';
import { WarningRounded } from '@mui/icons-material';
import { Button, ButtonProps, Skeleton } from '@mui/material';
import React from 'react';
import { logger } from '@/logger';
import { useSnackbarContext } from '@/components/Snackbar';

export type RevokeSessionsButtonProps = ButtonProps;

export const RevokeSessionsButton: React.FC<RevokeSessionsButtonProps> = (props) => {
  const { isPending } = authClient.useSession();
  const { showSnackbar } = useSnackbarContext();

  if (isPending) {
    return <Skeleton variant="rounded" width={200} height={36} />;
  }

  const handleSessionRevoke = async () => {
    const { error } = await authClient.revokeSessions();
    if (error) {
      logger.error('Error revoking all sessions: %s', error.message);
      showSnackbar({ message: error.message || 'Failed to revoke all sessions' });
    }

    await revalidateSession();
    const msg = 'All active sessions have been revoked!';
    logger.info(msg);
    showSnackbar({ message: msg });
  };

  return (
    <Button {...props} color="warning" startIcon={<WarningRounded />} onClick={handleSessionRevoke}>
      Revoke all sessions
    </Button>
  );
};
