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
import React from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {authClient} from '@/auth';
import {AppLogo} from '@/components/AppLogo/AppLogo.component';
import {Card} from '@/components/Base/Card';
import {PasswordInput} from '@/components/Base/Input';
import {withUnauthentificatedLayout} from '@/features/Auth';
import {SocialSignInBtn, useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';

const SignUp = () => {
  const navigate = useNavigate();
  const {session, revalidateSession, logout} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const [form, setForm] = React.useState<Record<string, string>>({});

  const redirectToDashboard = () => {
    navigate('/dashboard');
  };

  const formHandler = {
    inputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({...prev, [event.target.name]: event.target.value}));
    },
    formSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        const result = await authClient.signUp.email({
          name: `${form.name} ${form.surname}`,
          email: form.email,
          password: form.password,
        });
        if (result.error) {
          showSnackbar({
            message: result.error.message || 'Registration failed',
            action: <Button onClick={() => formHandler.formSubmit(event)}>Try again</Button>,
          });
          return;
        }
        showSnackbar({
          message: 'You have successfully registered and signed in!',
          action: <Button onClick={() => navigate('/settings')}>Settings</Button>,
        });
        await revalidateSession();
        redirectToDashboard();
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
                {Object.keys(AppConfig.authProvider).map(provider => (
                  <Grid key={provider} size={{xs: 6}}>
                    <SocialSignInBtn
                      key={provider}
                      provider={provider}
                      data-umami-event={'social-sign-up'}
                      data-umami-value={provider}
                    />
                  </Grid>
                ))}

                <Grid size={{xs: 12}}>
                  <Divider>or with</Divider>
                </Grid>

                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    variant="outlined"
                    label="Name"
                    name="name"
                    defaultValue={form.name}
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
                    defaultValue={form.surname}
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
                    defaultValue={form.email}
                    onChange={formHandler.inputChange}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <PasswordInput
                    outlinedInputProps={{
                      defaultValue: form.password,
                      onChange: formHandler.inputChange,
                    }}
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <FormControlLabel
                    required
                    defaultChecked={form.tos === 'true'}
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
