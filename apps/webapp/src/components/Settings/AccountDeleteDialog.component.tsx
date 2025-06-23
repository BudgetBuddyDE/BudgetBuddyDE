import {WarningRounded} from '@mui/icons-material';
import {Alert, Button, Dialog, DialogActions, DialogContent, type DialogProps, DialogTitle, Stack} from '@mui/material';

import {AppConfig} from '@/app.config';
import {useAuthContext} from '@/features/Auth';
import {logger} from '@/logger';

import {useSnackbarContext} from '../../features/Snackbar';
import {Transition} from '../Transition';

export type TAccountDeleteDialogProps = DialogProps;

export const AccountDeleteDialog: React.FC<TAccountDeleteDialogProps> = ({...dialogProps}) => {
  const {showSnackbar} = useSnackbarContext();
  const {session} = useAuthContext();

  const handleCancel = () => {
    dialogProps.onClose?.({}, 'backdropClick');
  };

  const handleAccountDelete = async () => {
    if (!session) {
      return showSnackbar({message: 'No session-user found', action: <Button onClick={handleCancel}>Close</Button>});
    }

    try {
      // FIXME: Implement the actual account deletion logic with the new auth client
      showSnackbar({
        message: 'This feature is not yet implemented. Please contact support if you want to delete your account.',
      });
      return;
      // if (session.marked_for_deletion) {
      //   return showSnackbar({
      //     message: 'Account already marked for deletion!',
      //     action: <Button onClick={handleCancel}>Close</Button>,
      //   });
      // }
      // const result = await pb.collection(PocketBaseCollection.USERS).update(session.id, {
      //   marked_for_deletion: format(addDays(new Date(), AppConfig.user.deletionThreshold), 'yyyy-MM-dd'),
      // });
      // if (!result) {
      //   showSnackbar({
      //     message: 'Failed for mark account for deletion!',
      //     action: <Button onClick={handleAccountDelete}>Retry</Button>,
      //   });
      //   return;
      // }

      // dialogProps.onClose?.({}, 'backdropClick');
      // showSnackbar({message: 'Your account has been marked for deletion!'});
    } catch (error) {
      logger.error("Something wen't wrong", error);
      showSnackbar({
        message: (error as Error).message,
        action: <Button onClick={handleAccountDelete}>Retry</Button>,
      });
    }
  };

  return (
    <Dialog
      PaperProps={{elevation: 0}}
      TransitionComponent={Transition}
      keepMounted
      maxWidth={'xs'}
      fullWidth
      {...dialogProps}>
      <DialogTitle textAlign={'center'}>Account deletion</DialogTitle>
      <DialogContent sx={{p: 1}}>
        <Alert severity="error">
          Are you sure you want to delete your {AppConfig.appName} account? The account will be{' '}
          <b>automatically deleted after 30 days</b>. During this period, the deletion can be undone. If the account is
          deleted, <b>all data will be permanently deleted</b> and cannot be recovered! <br />
          If you are sure, please confirm by selecting "Yes, delete my account!"
        </Alert>
      </DialogContent>
      <DialogActions>
        <Stack direction={'row'} spacing={AppConfig.baseSpacing}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button variant={'contained'} startIcon={<WarningRounded />} color={'error'} onClick={handleAccountDelete}>
            Yes, delete my account!
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
