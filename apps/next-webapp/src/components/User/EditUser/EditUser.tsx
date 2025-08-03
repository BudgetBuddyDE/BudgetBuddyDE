'use client';

import React from 'react';
import { useKeyPress } from '@/hooks/useKeyPress';
import { authClient, revalidateSession } from '@/authClient';
import { Card } from '@/components/Card';
import { Alert, Box, Button, Grid, Stack, TextField } from '@mui/material';
import { logger } from '@/logger';
import { useSnackbarContext } from '@/components/Snackbar';

// TODO: Re-implement account deletion functionality
export const EditUser = () => {
  const {
    isPending: isSessionPending,
    data: sessionData,
    error: sessionError,
  } = authClient.useSession();
  if (sessionError) throw sessionError;
  const { showSnackbar } = useSnackbarContext();
  const saveBtnRef = React.useRef<HTMLButtonElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isFormEditable, setFormEditable] = React.useState(false);

  async function onSubmit(formData: FormData) {
    try {
      logger.info('Submitting user profile changes');

      const name = formData.get('name');
      const email = formData.get('email');

      if (name && name !== sessionData?.user.name) {
        const result = await authClient.updateUser({ name: name as string });
        if (result.error) {
          throw result.error;
        }
        showSnackbar({ message: `Your name has been updated to ${name}` });
      }

      if (email && email !== sessionData?.user.email) {
        const result = await authClient.changeEmail({ newEmail: email as string });
        if (result.error) {
          throw result.error;
        }
        showSnackbar({ message: `Your email has been updated to ${email}` });
      }

      await revalidateSession();
      showSnackbar({ message: "Changes we're saved" });
      setFormEditable(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error while updating user profile: %s', msg);
      showSnackbar({
        message: msg,
        action: <Button onClick={() => onSubmit(formData)}>Try again</Button>,
      });
    }
  }

  const handleEdit = () => {
    setFormEditable(true);
  };

  const handleDiscard = () => {
    formRef.current?.reset();
    setFormEditable(false);
    showSnackbar({ message: 'Changes were discarded' });
  };

  // FIXME: Doen't work anymore :()
  useKeyPress(
    ['s'],
    () => {
      if (!saveBtnRef.current || !isFormEditable) return;
      saveBtnRef.current.click();
    },
    formRef.current,
    true
  );

  React.useEffect(() => {
    return () => {
      handleDiscard();
    };
  }, []);

  if (isSessionPending || !sessionData) return null; // should never be the case
  return (
    <React.Fragment>
      {!sessionData.user.emailVerified && (
        <Alert severity="warning" title="E-Mail" sx={{ mb: 2 }}>
          Please verify your email address to access all features of Budget Buddy.
        </Alert>
      )}

      <Card>
        <Card.Header>
          <Box>
            <Card.Title>Profile</Card.Title>
            <Card.Subtitle>Make changes to your account</Card.Subtitle>
          </Box>
        </Card.Header>
        <Card.Body>
          <form ref={formRef} action={onSubmit}>
            <Grid container spacing={2} rowSpacing={1}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  disabled
                  id="uuid"
                  name="uuid"
                  label="UUID"
                  defaultValue={sessionData.user.id}
                  sx={{ mt: 2 }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  id="name"
                  name="name"
                  label="Name"
                  defaultValue={sessionData.user.name}
                  sx={{ mt: 2 }}
                  fullWidth
                  disabled={!isFormEditable}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="E-Mail"
                  defaultValue={sessionData.user.email}
                  sx={{ mt: 2 }}
                  disabled={!isFormEditable}
                  required
                />
              </Grid>
            </Grid>

            <Stack direction={'row'} justifyContent={'space-between'} sx={{ mt: 2 }}>
              {/* <Button startIcon={<DeleteRounded />} color="error" onClick={handler.openDeleteDialog}>
              Delete Account
            </Button> */}

              {isFormEditable ? (
                <Box>
                  <Button variant="text" sx={{ mr: 1 }} onClick={handleDiscard}>
                    Discard
                  </Button>

                  <Button type="submit" variant="contained">
                    Save changes
                  </Button>
                </Box>
              ) : (
                <Button variant="contained" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </Stack>
          </form>
        </Card.Body>
      </Card>
    </React.Fragment>
  );
};
