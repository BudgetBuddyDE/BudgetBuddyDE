'use client';

import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {Alert, Box, Button, Grid, Stack, TextField} from '@mui/material';
import {useTranslations} from 'next-intl';
import React from 'react';
import {authClient, revalidateSession} from '@/authClient';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';
import {useKeyPress} from '@/hooks/useKeyPress';
import {logger} from '@/logger';
import {DeleteUserDialog} from './DeleteUserDialog';

// TODO: Re-implement account deletion functionality
export const EditUser = () => {
  const t = useTranslations('EditUser');
  const {isPending: isSessionPending, data: sessionData, error: sessionError} = authClient.useSession();
  if (sessionError) throw sessionError;
  const {showSnackbar} = useSnackbarContext();
  const saveBtnRef = React.useRef<HTMLButtonElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isFormEditable, setFormEditable] = React.useState(false);
  const [showAccountDeletionDialog, setShowAccountDeletionDialog] = React.useState(false);

  async function onSubmit(formData: FormData) {
    try {
      logger.info('Submitting user profile changes');
      if (!sessionData) {
        logger.error('No session data available');
        showSnackbar({message: t('noSessionData')});
        return;
      }

      const name = formData.get('name');
      const email = formData.get('email');

      if (name && name !== sessionData.user.name) {
        const result = await authClient.updateUser({name: name as string});
        if (result.error) {
          throw result.error;
        }
        showSnackbar({message: t('nameUpdated', {name: String(name)})});
      }

      if (email && email !== sessionData.user.email) {
        logger.info('Changing user email', {from: sessionData.user.email, to: email});
        const result = await authClient.changeEmail({
          newEmail: email as string,
          callbackURL: `${window.location.origin}/email/changed`,
        });
        if (result.error) {
          throw result.error;
        }
        showSnackbar({
          message: t('emailChangeSent', {email: String(email)}),
        });
      }

      await revalidateSession();
      // showSnackbar({ message: "Changes we're saved" });
      setFormEditable(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (e instanceof Error) logger.error('Error while updating user profile', e);
      else logger.error('Error while updating user profile', {reason: msg});
      showSnackbar({
        message: msg,
        action: <Button onClick={() => onSubmit(formData)}>{t('tryAgain')}</Button>,
      });
    }
  }

  const handleEdit = () => {
    setFormEditable(true);
  };

  const handleDiscard = () => {
    formRef.current?.reset();
    setFormEditable(false);
    showSnackbar({message: t('changesDiscarded')});
  };

  const accountDeletionHandler = {
    onClickDelete() {
      setShowAccountDeletionDialog(true);
    },
    onCancelDeletion() {
      setShowAccountDeletionDialog(false);
    },
    async onConfirmDeletion(password?: string) {
      const {error} = await authClient.deleteUser({
        password,
        callbackURL: `${window.location.origin}/user/confirm-deletion`,
      });
      if (error) {
        logger.error('Error while deleting user account', {reason: error.message});
        showSnackbar({
          message: error.message ?? t('deleteAccountError'),
          action: <Button onClick={accountDeletionHandler.onClickDelete}>{t('tryAgain')}</Button>,
        });
        return;
      }

      showSnackbar({
        message: t('deletionVerificationSent'),
      });

      accountDeletionHandler.onCancelDeletion();
    },
  };

  const handleSendVerificationEmail = async () => {
    if (!sessionData) {
      logger.error('No session data available, cannot send verification email');
      return;
    }

    if (sessionData.user.emailVerified) {
      logger.warn('Email is already verified, no need to send verification email');
      showSnackbar({message: t('emailAlreadyVerified')});
      return;
    }

    const {error} = await authClient.sendVerificationEmail({
      email: sessionData.user.email,
      callbackURL: `${window.location.origin}/email/verified`,
    });

    if (error) {
      logger.error('Error while sending verification email', {reason: error.message});
      showSnackbar({
        message: error.message ? t('verificationEmailError', {error: error.message}) : t('deleteAccountError'),
      });
      return;
    }

    showSnackbar({
      message: t('verificationEmailSent'),
    });
  };

  useKeyPress(
    ['s'],
    e => {
      if (!saveBtnRef.current || !isFormEditable) {
        return showSnackbar({
          message: t('editBeforeSaving'),
        });
      }
      e.preventDefault();
      saveBtnRef.current.click();
    },
    // cardRef.current,
    undefined,
    true,
  );

  React.useEffect(() => {
    return () => {
      formRef.current?.reset();
      setFormEditable(false);
    };
  }, []);

  if (isSessionPending || !sessionData) return null; // should never be the case
  return (
    <React.Fragment>
      <Card ref={cardRef}>
        <Card.Header>
          <Box>
            <Card.Title>{t('profile')}</Card.Title>
            <Card.Subtitle>{t('description')}</Card.Subtitle>
          </Box>
        </Card.Header>
        <Card.Body>
          <form ref={formRef} action={onSubmit}>
            <Grid container spacing={2} rowSpacing={1}>
              <Grid size={{xs: 12}}>
                <TextField
                  fullWidth
                  disabled
                  id="uuid"
                  name="uuid"
                  label={t('uuid')}
                  defaultValue={sessionData.user.id}
                  sx={{mt: 2}}
                  required
                />
              </Grid>
              <Grid size={{xs: 12}}>
                <TextField
                  id="name"
                  name="name"
                  label={t('name')}
                  defaultValue={sessionData.user.name}
                  sx={{mt: 2}}
                  fullWidth
                  disabled={!isFormEditable}
                  required
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label={t('email')}
                  defaultValue={sessionData.user.email}
                  sx={{mt: 2}}
                  disabled={!isFormEditable}
                  required
                />

                {!sessionData.user.emailVerified && (
                  <Alert severity="warning" title={t('email')} sx={{mt: 2}}>
                    {t('verifyEmailPrompt')}
                    <Button size="small" variant="text" color="warning" onClick={handleSendVerificationEmail}>
                      {t('verifyEmail')}
                    </Button>
                  </Alert>
                )}
              </Grid>
            </Grid>

            <Stack
              direction={'row'}
              sx={{
                justifyContent: 'space-between',
                mt: 2,
              }}
            >
              <Button startIcon={<DeleteRounded />} color="error" onClick={accountDeletionHandler.onClickDelete}>
                {t('deleteAccount')}
              </Button>

              {isFormEditable ? (
                <Box>
                  <Button variant="text" sx={{mr: 1}} onClick={handleDiscard}>
                    {t('discard')}
                  </Button>

                  <Button ref={saveBtnRef} type="submit" variant="contained">
                    {t('saveChanges')}
                  </Button>
                </Box>
              ) : (
                <Button variant="contained" onClick={handleEdit}>
                  {t('edit')}
                </Button>
              )}
            </Stack>
          </form>
        </Card.Body>
      </Card>

      <DeleteUserDialog
        open={showAccountDeletionDialog}
        onCancel={accountDeletionHandler.onCancelDeletion}
        onClose={accountDeletionHandler.onCancelDeletion}
        onConfirm={accountDeletionHandler.onConfirmDeletion}
      />
    </React.Fragment>
  );
};
