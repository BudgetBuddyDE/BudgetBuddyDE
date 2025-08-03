'use client';

import { AppLogo } from '@/components/AppLogo';
import { Card } from '@/components/Card';
import { PasswordInput } from '@/components/Form/PasswordInput';
import { SendRounded } from '@mui/icons-material';
import { Box, Button, Divider, Grid, Link, TextField, Typography } from '@mui/material';
import React from 'react';
import NextLink from 'next/link';
import { authClient } from '@/authClient';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { type AuthProvider, SocialAuthButton } from '@/components/User/SocialAuthButton';
import { useSnackbarContext } from '@/components/Snackbar';
import { useFormStatus } from 'react-dom';

export default function SignInPage() {
  const { showSnackbar } = useSnackbarContext();
  const { pending: isPending } = useFormStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams?.get('email') || '';

  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await authClient.signIn.email({
      email,
      password,
      fetchOptions: {
        onError: (ctx) => {
          showSnackbar({ message: ctx.error.message });
          // Set email as query-param on errors
          const params = new URLSearchParams();
          if (email) {
            params.set('email', email);
          }
          router.push(`/sign-in?${params.toString()}`);
        },
        onSuccess: async () => {
          showSnackbar({ message: "You have been signed in! You're getting redirected..." });
          redirect('/dashboard');
        },
      },
    });
  }

  return (
    <React.Fragment>
      <Grid container justifyContent={'center'}>
        <Grid size={{ xs: 12, md: 4, xl: 3.5 }}>
          <Card sx={{ py: 3, px: 4 }}>
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

              <Typography variant={'h5'} textAlign={'center'} fontWeight={'bolder'} sx={{ mt: 2 }}>
                Sign in
              </Typography>
            </Box>

            <form action={onSubmit}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {(['google', 'github'] as AuthProvider[]).map((provider) => (
                  <Grid key={provider} size={{ xs: 6 }}>
                    <SocialAuthButton key={provider} provider={provider} disabled={isPending} />
                  </Grid>
                ))}

                <Grid size={{ xs: 12 }}>
                  <Divider>or with</Divider>
                </Grid>

                <Grid size={{ xs: 12 }}>
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

                <Grid size={{ xs: 12 }}>
                  <PasswordInput />

                  <Link
                    tabIndex={-1}
                    variant="caption"
                    href="/request-password-reset"
                    sx={{ textDecoration: 'none', mt: 0.5 }}
                    component={Button}
                  >
                    Forgot password?
                  </Link>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendRounded />}
                  sx={{ mt: 1 }}
                  disabled={isPending}
                >
                  Sign in
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 2 }}>No account?</Divider>

            <Button LinkComponent={NextLink} href="/sign-up" variant="contained" fullWidth>
              Create an account
            </Button>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
