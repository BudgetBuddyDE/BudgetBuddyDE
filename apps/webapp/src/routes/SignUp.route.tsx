import {ExitToAppRounded, HomeRounded, SendRounded} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid2 as Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {type RecordAuthResponse, type RecordModel} from 'pocketbase';
import React from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {AppLogo} from '@/components/AppLogo/AppLogo.component';
import {Card} from '@/components/Base/Card';
import {PasswordInput} from '@/components/Base/Input';
import {withUnauthentificatedLayout} from '@/features/Auth';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {AuthService} from '@/services/Auth';
import {authClient} from '@/services/Auth/authClient';

const SignUp = () => {
  const navigate = useNavigate();
  const {session, logout} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const [form, setForm] = React.useState<Record<string, string>>();

  const redirectToDashboard = () => {
    navigate('/dashboard');
  };

  const formHandler = {
    inputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({...prev, [event.target.name]: event.target.value}));
    },
    handleAuthProviderLogin: (response: RecordAuthResponse<RecordModel>) => {
      showSnackbar({message: `Welcome ${response.record.username}!`});
      navigate('/');
    },
    // signUpWithSocial: async (provider: TExternalAuthProvider) => {
    //   try {
    //     const result = await authClient.signIn.social({
    //       callbackURL: `https://prod.auth.budget-buddy.de/api/auth/callback/github`,
    //       provider: provider,
    //       fetchOptions: {
    //         onSuccess(context) {
    //           console.log('Social sign up success:', context);
    //         },
    //       },
    //     });
    //     if (result.error) {
    //       showSnackbar({message: result.error.message || 'Social sign up failed'});
    //       return;
    //     }
    //     console.log('Social sign up result:', result);
    //   } catch (error) {
    //     showSnackbar({message: (error as Error).message || 'Social sign up failed'});
    //   }
    // },
    formSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form) return;
      if (!AuthService.isEmail(form.email)) {
        showSnackbar({message: 'Please enter a valid email address.'});
        return;
      }

      try {
        const signUpResult = await authClient.signUp.email({
          name: `${form.name} ${form.surname}`,
          email: form.email as string,
          password: form.password as string,
        });

        if (signUpResult.error) {
          showSnackbar({message: signUpResult.error.message || 'Registration failed'});
          return;
        }

        logger.info('User registered successfully:' + signUpResult.data.user.id);

        const signInResult = await authClient.signIn.email({
          email: form.email as string,
          password: form.password as string,
          fetchOptions: {
            credentials: 'include',
          },
        });
        if (signInResult.error) {
          showSnackbar({message: signInResult.error.message || 'Login failed'});
          return;
        }
        logger.info('User logged in successfully:' + signInResult.data.user.id);

        showSnackbar({message: "Your account has been created and you're logged in!"});
        navigate('/');
      } catch (error) {
        logger.error("Something wen't wrong", error);
        showSnackbar({message: (error as Error).message || 'Registration failed'});
      }
    },
  };

  return (
    <React.Fragment>
      {session && (
        <Stack
          flexDirection={'row'}
          sx={{position: 'absolute', top: theme => theme.spacing(2), right: theme => theme.spacing(2)}}
          gap={AppConfig.baseSpacing}>
          <Button startIcon={<HomeRounded />} onClick={redirectToDashboard}>
            Dashboard
          </Button>

          <Button startIcon={<ExitToAppRounded />} onClick={logout}>
            Sign out
          </Button>
        </Stack>
      )}
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

              <Typography variant={'h4'} textAlign={'center'} fontWeight={'bolder'} sx={{mt: 2}}>
                Sign up
              </Typography>
            </Box>

            <form onSubmit={formHandler.formSubmit}>
              <Grid container spacing={AppConfig.baseSpacing} sx={{mt: 1}}>
                {/* {Object.keys(AppConfig.authProvider).map(provider => (
                  <Grid key={provider} size={{xs: 6}}>
                    <SocialSignInBtn
                      key={provider}
                      provider={provider as TExternalAuthProvider}
                      onClick={async () => {
                        console.log(await formHandler.signUpWithSocial(provider as TExternalAuthProvider));
                      }}
                      data-umami-event={'social-sign-up'}
                      data-umami-value={provider}
                    />
                  </Grid>
                ))} */}

                {/* <Grid size={{xs: 12}}>
                  <Divider>or with</Divider>
                </Grid> */}

                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    variant="outlined"
                    label="Name"
                    name="name"
                    defaultValue={form?.name}
                    onChange={formHandler.inputChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    variant="outlined"
                    label="Surname"
                    name="surname"
                    defaultValue={form?.surname}
                    onChange={formHandler.inputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <TextField
                    variant="outlined"
                    type="email"
                    label="E-Mail"
                    name="email"
                    defaultValue={form?.email}
                    onChange={formHandler.inputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <PasswordInput
                    outlinedInputProps={{
                      defaultValue: form?.password,
                      onChange: formHandler.inputChange,
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
                        <Link href={AppConfig.website + '/tos'} target="_blank">
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
                  data-umami-event={'default-sign-up'}>
                  Sign up
                </Button>
              </Box>
            </form>

            <Divider sx={{my: 2}}>Already registered?</Divider>

            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*@ts-expect-error*/}
            <Button
              LinkComponent={RouterLink}
              to={'/sign-in'}
              variant={'contained'}
              size={'large'}
              startIcon={<SendRounded />}
              fullWidth
              data-umami-event={'sign-up-redirect-login'}>
              Sign in
            </Button>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withUnauthentificatedLayout(SignUp);
