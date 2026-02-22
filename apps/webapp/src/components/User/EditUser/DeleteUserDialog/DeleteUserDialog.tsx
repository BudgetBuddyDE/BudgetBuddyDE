'use client';

import {WarningRounded} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  type DialogProps as MuiDialogProps,
} from '@mui/material';
import type React from 'react';
import {Controller, useForm} from 'react-hook-form';
import {PasswordInput} from '@/components/Form/PasswordInput';
import {ZoomTransition} from '@/components/Transition';

export type DeleteDialogProps = Pick<
  MuiDialogProps,
  'open' | 'onClose' | 'maxWidth' | 'TransitionComponent' | 'TransitionProps' | 'transitionDuration'
> & {
  onCancel: () => void;
  onConfirm: (password?: string) => void;
  withTransition?: boolean;
};

export const DeleteUserDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  maxWidth = 'xs',
  onCancel,
  onConfirm,
  withTransition = false,
  ...transitionProps
}) => {
  const form = useForm<{password: string}>({mode: 'onBlur'});

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (onClose) {
          form.reset({password: ''});
          onClose(event, reason);
        }
      }}
      maxWidth={maxWidth}
      slotProps={{
        paper: {elevation: 0},
      }}
      {...transitionProps}
      // FIXME: Don't use deprecated TransitionComponent prop
      TransitionComponent={
        withTransition
          ? !transitionProps.TransitionComponent
            ? ZoomTransition
            : transitionProps.TransitionComponent
          : undefined
      }
    >
      <DialogTitle variant="h4" sx={{display: 'flex', flexDirection: 'column', textAlign: 'center'}}>
        <WarningRounded fontSize="large" sx={{mx: 'auto'}} />
        Attention
      </DialogTitle>
      <form
        onSubmit={form.handleSubmit(({password}) => {
          onConfirm(password);
          form.reset({password: ''});
        })}
        noValidate
      >
        <DialogContent>
          <DialogContentText variant="inherit" textAlign="center">
            Are you sure you want to delete your account? This action is irreversible and will remove all your data
            permanently.
          </DialogContentText>

          <Controller
            name="password"
            control={form.control}
            rules={{required: 'Password is required to delete your account'}}
            render={({field, fieldState: {error}}) => (
              <PasswordInput
                formControlProps={{sx: {mt: 2}}}
                outlinedInputProps={{
                  ...field,
                  label: 'Confirm with your password',
                  placeholder: 'Password123',
                  error: !!error,
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              form.reset({password: ''});
              onCancel();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" color="error" variant="contained" autoFocus>
            Yes, confirm deletion!
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
