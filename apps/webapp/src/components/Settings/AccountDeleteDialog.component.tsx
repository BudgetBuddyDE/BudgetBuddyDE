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

import {AppConfig} from '@/app.config';
import {useAuthContext} from '@/features/Auth';
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
      const result = await pb.collection(PocketBaseCollection.USERS).delete(sessionUser.id);
      if (!result) {
        showSnackbar({
          message: 'Failed to delete account',
          action: <Button onClick={handleAccountDelete}>Retry</Button>,
        });
      }

      dialogProps.onClose?.({}, 'backdropClick');
      showSnackbar({message: 'You have deleted your account'});
    } catch (error) {
      console.error(error);
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
      <DialogTitle textAlign={'center'}>Confirm Account Deletion</DialogTitle>
      <DialogContent>
        <Typography variant={'body1'} textAlign={'center'}>
          Are you sure you want to delete your account on {AppConfig.appName}?{' '}
          <b>Your data will be permanently deleted and cannot be recovered!</b> <br />
          <br /> If you are certain, please confirm by typing "Yes, delete my account!"
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
