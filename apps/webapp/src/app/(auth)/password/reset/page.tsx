'use client';

import {SendRounded} from '@mui/icons-material';
import {Box, Button, Divider, Grid, Typography} from '@mui/material';
import NextLink from 'next/link';
import {redirect, useSearchParams} from 'next/navigation';
import {authClient} from '@/authClient';
import {AppLogo} from '@/components/AppLogo';
import {Card} from '@/components/Card';
import {PasswordInput} from '@/components/Form/PasswordInput';
import {useSnackbarContext} from '@/components/Snackbar';

export default function ResetPasswordPage() {
  const {showSnackbar} = useSnackbarContext();
  const searchParams = useSearchParams();

  async function onSubmit(formData: FormData) {
    const token = searchParams.get('token');
    if (!token) {
      showSnackbar({
        message: 'No password reset token found in your URL.',
        action: (
          <Button LinkComponent={NextLink} href="/password/request-reset">
            Restart process
          </Button>
        ),
      });
      return;
    }

    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
      showSnackbar({message: 'Passwords do not match'});
      return;
    }

    await authClient.resetPassword({
      newPassword: password as string,
      token,
    });

    showSnackbar({
      message: 'Your password has been reset! You can now sign in.',
    });
    redirect('/sign-in');
  }

  return (
    <Grid container justifyContent={'center'}>
      <Grid size={{xs: 12, md: 4, xl: 3.5}}>
        <Card sx={{py: 3, px: 4}}>
          <Box display="flex" flexDirection="column">
            <AppLogo
              style={{
                marginLeft: 'auto',
                marginRight: 'auto',
                borderRadius: '5px',
              }}
              width={96}
              height={96}
            />

            <Typography variant={'h5'} textAlign={'center'} fontWeight={'bolder'} sx={{mt: 2}}>
              Reset password
            </Typography>
          </Box>

          <form action={onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              <Grid size={{xs: 12}}>
                <PasswordInput />
              </Grid>

              <Grid size={{xs: 12}}>
                <PasswordInput
                  outlinedInputProps={{
                    label: 'Confirm password',
                    name: 'confirm-password',
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button type="submit" variant="contained" endIcon={<SendRounded />} sx={{mt: 1}}>
                Save new password
              </Button>
            </Box>
          </form>

          <Divider sx={{my: 2}}>or</Divider>

          <Button LinkComponent={NextLink} href="/sign-in" variant="contained" fullWidth sx={{mb: 2}}>
            Sign in
          </Button>

          <Button LinkComponent={NextLink} href="/sign-up" variant="contained" fullWidth>
            Create an account
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
}
