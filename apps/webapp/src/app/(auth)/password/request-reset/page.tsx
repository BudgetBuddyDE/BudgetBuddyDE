'use client';

import {SendRounded} from '@mui/icons-material';
import {Box, Button, Divider, Grid, TextField, Typography} from '@mui/material';
import NextLink from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useFormStatus} from 'react-dom';
import {authClient} from '@/authClient';
import {AppLogo} from '@/components/AppLogo';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';

export default function RequestPasswordResetPage() {
  const {showSnackbar} = useSnackbarContext();
  const {pending: isPending} = useFormStatus();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams?.get('email') || '';

  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string;

    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/password/reset`,
    });

    showSnackbar({
      message: 'If an account with that email exists, a password reset link has been sent. Check your inbox',
    });
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
              Request password reset
            </Typography>
          </Box>

          <form action={onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              <Grid size={{xs: 12}}>
                <TextField
                  variant="outlined"
                  placeholder="Enter email"
                  type="email"
                  label="E-Mail"
                  name="email"
                  defaultValue={emailFromQuery}
                  disabled={isPending}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button type="submit" variant="contained" endIcon={<SendRounded />} sx={{mt: 1}} disabled={isPending}>
                Submit request
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
