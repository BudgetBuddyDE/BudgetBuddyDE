import {type AlertProps} from '@mui/material';
import React from 'react';

export type TAccountDeletionAlertProps = AlertProps;

// FIXME: Re-implement after account deletion feature is ready
export const AccountDeletionAlert: React.FC<TAccountDeletionAlertProps> = () => {
  // const {session} = useAuthContext();
  // const {showSnackbar} = useSnackbarContext();

  // const handleRevertDeletion = React.useCallback(async () => {
  //   if (!session || !session.marked_for_deletion) {
  //     showSnackbar({message: 'No session-user found'});
  //     return;
  //   }

  //   const result = await pb.collection(PocketBaseCollection.USERS).update(session.id, {
  //     marked_for_deletion: null,
  //   });
  //   if (!result) {
  //     showSnackbar({
  //       message: 'Failed for revert account deletion!',
  //       action: <Button onClick={handleRevertDeletion}>Retry</Button>,
  //     });
  //     return;
  //   }

  //   showSnackbar({message: 'Your account deletion has been reverted!'});
  // }, [session]);

  return null;
  // if (!session || !session.marked_for_deletion) return null;
  // return (
  //   <Alert
  //     {...alertProps}
  //     severity="warning"
  //     action={
  //       <Button color="inherit" size="small" onClick={handleRevertDeletion}>
  //         Revert deletion
  //       </Button>
  //     }>
  //     This account is scheduled for deletion and will be <b>deleted on</b>{' '}
  //     <b>{format(new Date(session.marked_for_deletion), 'dd.MM.yyyy')}</b>. You can cancel the deletion at any time.
  //   </Alert>
  // );
};
