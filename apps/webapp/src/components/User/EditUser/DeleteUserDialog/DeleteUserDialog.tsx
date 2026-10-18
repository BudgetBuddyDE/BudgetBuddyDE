'use client';

import WarningRounded from '@mui/icons-material/WarningRounded';
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
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type DeleteDialogProps = Pick<MuiDialogProps, 'open' | 'onClose' | 'maxWidth' | 'transitionDuration'> & {
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
  transitionDuration,
}) => {
  const t = useAppTranslations();
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
      transitionDuration={transitionDuration}
      slots={{
        transition: withTransition ? ZoomTransition : undefined,
      }}
    >
      <DialogTitle variant="h4" sx={{display: 'flex', flexDirection: 'column', textAlign: 'center'}}>
        <WarningRounded fontSize="large" sx={{mx: 'auto'}} />
        {t('account.profile.attention')}
      </DialogTitle>
      <form
        onSubmit={form.handleSubmit(({password}) => {
          onConfirm(password);
          form.reset({password: ''});
        })}
        noValidate
      >
        <DialogContent>
          <DialogContentText
            variant="inherit"
            sx={{
              textAlign: 'center',
            }}
          >
            {t('account.profile.deleteConfirmation')}
          </DialogContentText>

          <Controller
            name="password"
            control={form.control}
            rules={{required: t('account.profile.passwordIsRequiredToDeleteYourAccount')}}
            render={({field, fieldState: {error}}) => (
              <PasswordInput
                formControlProps={{sx: {mt: 2}}}
                outlinedInputProps={{
                  ...field,
                  label: t('account.profile.confirmWithYourPassword'),
                  placeholder: t('forms.enterPassword'),
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
            {t('account.profile.cancel')}
          </Button>
          <Button type="submit" color="error" variant="contained" autoFocus>
            {t('account.profile.yesConfirmDeletion')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
