import {DeleteRounded, PersonRounded} from '@mui/icons-material';
import {Box, Button, Grid2 as Grid, Stack, TextField} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';
import {authClient} from '@/auth';
import {Card} from '@/components/Base/Card';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {useKeyPress} from '@/hooks/useKeyPress';
import {logger} from '@/logger';

import {NoResults} from '../NoResults';
import {AccountDeleteDialog} from './AccountDeleteDialog.component';

interface IEditProfileHandler {
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  onChangeInput: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDiscard: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export type TEditProfileProps = unknown;

export const EditProfile: React.FC<TEditProfileProps> = () => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const saveBtnRef = React.useRef<HTMLButtonElement>(null);
  const {showSnackbar} = useSnackbarContext();
  const {session, revalidateSession} = useAuthContext();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isFormEditable, setFormEditable] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});

  useKeyPress(
    ['s'],
    () => {
      if (!saveBtnRef.current || !isFormEditable) return;
      saveBtnRef.current.click();
    },
    formRef.current,
    true,
  );

  const handler: IEditProfileHandler = {
    openDeleteDialog() {
      setDeleteDialogOpen(true);
    },
    closeDeleteDialog() {
      setDeleteDialogOpen(false);
    },
    onChangeInput(event) {
      setForm(prev => ({...prev, [event.target.name]: event.target.value}));
    },
    onDiscard() {
      if (!session) return; // should never be the case
      setFormEditable(false);
      setForm({
        name: session.user.name,
        email: session.user.email,
      });
    },
    async onSubmit(event) {
      event.preventDefault();
      if (!session) return;
      try {
        // await pb.collection('users').update(session.id, form);

        if (form.name) {
          const result = await authClient.updateUser({name: form.name});
          if (result.error) {
            showSnackbar({
              message: result.error.message || 'Failed to update user',
              action: <Button onClick={() => handler.onSubmit(event)}>Try again</Button>,
            });
            return;
          }

          await revalidateSession();
          showSnackbar({message: `Your name has been updated to ${form.name}`});
        }

        if (form.email) {
          const result = await authClient.changeEmail({newEmail: form.email});
          if (result.error) {
            showSnackbar({
              message: result.error.message || 'Failed to update email',
              action: <Button onClick={() => handler.onSubmit(event)}>Try again</Button>,
            });
            return;
          }
          await revalidateSession();
          showSnackbar({message: `Your email has been updated to ${form.email}`});
        }

        showSnackbar({message: "Changes we're saved"});
        setFormEditable(false);
      } catch (error) {
        logger.error("Something wen't wrong", error);
        showSnackbar({message: (error as Error).message});
      }
    },
  };

  if (!session) {
    return (
      <Card>
        <NoResults icon={<PersonRounded />} text="No user found" />
      </Card>
    );
  }
  return (
    <React.Fragment>
      <Card>
        <Card.Header>
          <Box>
            <Card.Title>Profile</Card.Title>
            <Card.Subtitle>Make changes to your account</Card.Subtitle>
          </Box>
        </Card.Header>
        <Card.Body>
          <form ref={formRef} onSubmit={handler.onSubmit}>
            <Grid container spacing={AppConfig.baseSpacing} rowSpacing={Math.round(AppConfig.baseSpacing / 2)}>
              <Grid size={{xs: 12}}>
                <TextField
                  fullWidth
                  disabled
                  id="uuid"
                  name="uuid"
                  label="UUID"
                  value={session.user.id}
                  defaultValue={session.user.id}
                  sx={{mt: 2}}
                  required
                />
              </Grid>
              <Grid size={{xs: 12}}>
                <TextField
                  id="name"
                  name="name"
                  label="Name"
                  value={form.name}
                  defaultValue={session.user.name}
                  onChange={handler.onChangeInput}
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
                  label="E-Mail"
                  value={form.email}
                  defaultValue={session.user.email}
                  sx={{mt: 2}}
                  disabled={!isFormEditable}
                  required
                />
              </Grid>
            </Grid>

            <Stack direction={'row'} justifyContent={'space-between'} sx={{mt: 2}}>
              <Button startIcon={<DeleteRounded />} color="error" onClick={handler.openDeleteDialog}>
                Delete Account
              </Button>

              {isFormEditable ? (
                <Box>
                  <Button variant="text" sx={{mr: 1}} onClick={handler.onDiscard}>
                    Discard
                  </Button>

                  <Button type="submit" variant="contained">
                    Save changes
                  </Button>
                </Box>
              ) : (
                <Button variant="contained" onClick={() => setFormEditable(true)}>
                  Edit
                </Button>
              )}
            </Stack>
          </form>
        </Card.Body>
      </Card>

      <AccountDeleteDialog open={isDeleteDialogOpen} onClose={handler.closeDeleteDialog} />
    </React.Fragment>
  );
};
