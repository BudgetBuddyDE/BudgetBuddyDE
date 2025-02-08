import {PocketBaseCollection} from '@budgetbuddyde/types';
import {WarningRounded} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {addDays, format} from 'date-fns';

import {AppConfig} from '@/app.config';
import {useAuthContext} from '@/features/Auth';
import {logger} from '@/logger';
import {pb} from '@/pocketbase';

import {useSnackbarContext} from '../../features/Snackbar';
import {Transition} from '../Transition';

export type TAccountDeleteDialogProps = DialogProps;

export const AccountDeleteDialog: React.FC<TAccountDeleteDialogProps> = ({...dialogProps}) => {
  const {showSnackbar} = useSnackbarContext();
  const {sessionUser} = useAuthContext();

  const handleCancel = () => {
    dialogProps.onClose?.({}, 'backdropClick');
  };

  const handleAccountDelete = async () => {
    if (!sessionUser) {
      return showSnackbar({message: 'No session-user found', action: <Button onClick={handleCancel}>Close</Button>});
    }

    try {
      if (sessionUser.marked_for_deletion) {
        return showSnackbar({
          message: 'Account already marked for deletion!',
          action: <Button onClick={handleCancel}>Close</Button>,
        });
      }
      const result = await pb.collection(PocketBaseCollection.USERS).update(sessionUser.id, {
        marked_for_deletion: format(addDays(new Date(), AppConfig.user.deletionThreshold), 'yyyy-MM-dd'),
      });
      if (!result) {
        showSnackbar({
          message: 'Failed for mark account for deletion!',
          action: <Button onClick={handleAccountDelete}>Retry</Button>,
        });
        return;
      }

      dialogProps.onClose?.({}, 'backdropClick');
      showSnackbar({message: 'Your account has been marked for deletion!'});
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
      <DialogContent>
        <Typography variant={'body1'} textAlign={'center'}>
          Are you sure you want to delete your {AppConfig.appName} account? The account will be{' '}
          <b>automatically deleted after 30 days</b>. During this period, the deletion can be undone. If the account is
          deleted, <b>all data will be permanently deleted</b> and cannot be recovered! <br />
          If you are sure, please confirm by selecting "Yes, delete my account!"
        </Typography>
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
