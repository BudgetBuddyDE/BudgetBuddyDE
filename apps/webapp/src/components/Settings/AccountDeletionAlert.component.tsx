import {PocketBaseCollection} from '@budgetbuddyde/types';
import {Alert, type AlertProps, Button} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {pb} from '@/pocketbase';

export type TAccountDeletionAlertProps = AlertProps;

export const AccountDeletionAlert: React.FC<TAccountDeletionAlertProps> = ({...alertProps}) => {
  const {session: sessionUser} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();

  const handleRevertDeletion = React.useCallback(async () => {
    if (!sessionUser || !sessionUser.marked_for_deletion) {
      showSnackbar({message: 'No session-user found'});
      return;
    }

    const result = await pb.collection(PocketBaseCollection.USERS).update(sessionUser.id, {
      marked_for_deletion: null,
    });
    if (!result) {
      showSnackbar({
        message: 'Failed for revert account deletion!',
        action: <Button onClick={handleRevertDeletion}>Retry</Button>,
      });
      return;
    }

    showSnackbar({message: 'Your account deletion has been reverted!'});
  }, [sessionUser]);

  if (!sessionUser || !sessionUser.marked_for_deletion) return null;
  return (
    <Alert
      {...alertProps}
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={handleRevertDeletion}>
          Revert deletion
        </Button>
      }>
      This account is scheduled for deletion and will be <b>deleted on</b>{' '}
      <b>{format(new Date(sessionUser.marked_for_deletion), 'dd.MM.yyyy')}</b>. You can cancel the deletion at any time.
    </Alert>
  );
};
