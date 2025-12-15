'use client';

import {SendRounded} from '@mui/icons-material';
import {Box, Button, Checkbox, Divider, FormControlLabel, Grid, Link, TextField, Typography} from '@mui/material';
import NextLink from 'next/link';
import {redirect, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import {authClient} from '@/authClient';
import {AppLogo} from '@/components/AppLogo';
import {Card} from '@/components/Card';
import {PasswordInput} from '@/components/Form/PasswordInput';
import {useSnackbarContext} from '@/components/Snackbar';
import {type AuthProvider, SocialAuthButton} from '@/components/User/SocialAuthButton';

export default function SignUp() {
  const {showSnackbar} = useSnackbarContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nameFromQuery = searchParams?.get('name') || '';
  const surnameFromQuery = searchParams?.get('surname') || '';
  const emailFromQuery = searchParams?.get('email') || '';

  // Hilfsfunktion zum Setzen der Query-Parameter bei Fehlern
  const redirectWithFormData = (firstName: string, surname: string, email: string) => {
    const params = new URLSearchParams();
    if (firstName) params.set('name', firstName);
    if (surname) params.set('surname', surname);
    if (email) params.set('email', email);
    router.push(`/sign-up?${params.toString()}`);
  };

  async function onSubmit(formData: FormData) {
    const firstName = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
      showSnackbar({message: 'Passwords do not match'});
      redirectWithFormData(firstName, surname, email);
      return;
    }

    await authClient.signUp.email({
      name: `${firstName} ${surname}`,
      email,
      password: formData.get('password') as string,
      fetchOptions: {
        onError: ctx => {
          showSnackbar({message: ctx.error.message});
          redirectWithFormData(firstName, surname, email);
        },
        onSuccess: async () => {
          showSnackbar({
            message: "You have been signed up! You're getting redirected...",
          });
          redirect('/dashboard');
        },
      },
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
              Sign up
            </Typography>
          </Box>

          <form action={onSubmit}>
            <Grid container spacing={2} sx={{mt: 1}}>
              {(['google', 'github'] as AuthProvider[]).map(provider => (
                <Grid key={provider} size={{xs: 6}}>
                  <SocialAuthButton key={provider} provider={provider} />
                </Grid>
              ))}

              <Grid size={{xs: 12}}>
                <Divider>or with</Divider>
              </Grid>

              <Grid size={{xs: 6}}>
                <TextField
                  variant="outlined"
                  placeholder="Name"
                  type="text"
                  label="Name"
                  name="name"
                  defaultValue={nameFromQuery}
                  fullWidth
                  required
                />
              </Grid>

              <Grid size={{xs: 6}}>
                <TextField
                  variant="outlined"
                  placeholder="Surname"
                  type="text"
                  label="Surname"
                  name="surname"
                  defaultValue={surnameFromQuery}
                  fullWidth
                  required
                />
              </Grid>

              <Grid size={{xs: 12}}>
                <TextField
                  variant="outlined"
                  placeholder="Enter email"
                  type="email"
                  label="E-Mail"
                  name="email"
                  defaultValue={emailFromQuery}
                  fullWidth
                  required
                />
              </Grid>

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

              <Grid size={{xs: 12}}>
                <FormControlLabel
                  required
                  control={<Checkbox />}
                  label={
                    <React.Fragment>
                      I accept the{' '}
                      <Link href={'https://budget-buddy.de/tos'} target="_blank">
                        Terms of Service
                      </Link>
                    </React.Fragment>
                  }
                  sx={{mt: 1}}
                />
              </Grid>
            </Grid>

            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button
                type="submit"
                variant="contained"
                endIcon={<SendRounded />}
                sx={{mt: 1}}
                data-umami-event={'default-sign-up'}
              >
                Sign up
              </Button>
            </Box>
          </form>

          <Divider sx={{my: 2}}>Already registered?</Divider>

          <Button LinkComponent={NextLink} href="/sign-in" variant="contained" fullWidth>
            Sign in
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
}
