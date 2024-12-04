import {PocketBaseCollection} from '@budgetbuddyde/types';
import {AppRegistrationRounded, ExitToAppRounded, SendRounded} from '@mui/icons-material';
import {Box, Button, CircularProgress, Divider, Grid2 as Grid, TextField, Typography} from '@mui/material';
import React from 'react';
import {Link as RouterLink} from 'react-router-dom';

import {AppConfig} from '@/app.config';
import {AppLogo} from '@/components/AppLogo/AppLogo.component';
import {Card} from '@/components/Base/Card';
import {withUnauthentificatedLayout} from '@/features/Auth';
import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {pb} from '@/pocketbase.ts';

const RequestPasswordReset = () => {
  const {sessionUser, logout} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');

  const handler = {
    onSubmit: async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      try {
        setLoading(true);
        await pb.collection(PocketBaseCollection.USERS).requestPasswordReset(email);
        showSnackbar({message: 'Password reset email sent'});
      } catch (error) {
        console.error(error);
        showSnackbar({
          message: (error as Error).message,
          action: (
            <Button size="small" onClick={() => handler.onSubmit(e)}>
              Retry
            </Button>
          ),
        });
      } finally {
        setLoading(false);
      }
    },
  };

  return (
    <React.Fragment>
      {sessionUser && (
        <Button
          sx={{position: 'absolute', top: theme => theme.spacing(2), right: theme => theme.spacing(2)}}
          startIcon={<ExitToAppRounded />}
          onClick={logout}>
          Sign out
        </Button>
      )}
      <Card
        sx={{
          width: {xs: '90%', md: '40%', lg: '30%', xl: '25%'},
          maxWidth: '480px',
          mx: 'auto',
          px: 4,
          py: 2,
          textAlign: 'center',
        }}>
        <Card.Header sx={{display: 'flex', flexDirection: 'column'}}>
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
            Request password reset
          </Typography>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handler.onSubmit}>
            <Grid container spacing={AppConfig.baseSpacing} sx={{mt: 1}}>
              <Grid size={{xs: 12}}>
                <TextField
                  variant="outlined"
                  type="email"
                  label="E-Mail"
                  name="email"
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  fullWidth
                  required
                  disabled={loading}
                />
              </Grid>
            </Grid>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <Button
                type="submit"
                variant="contained"
                endIcon={loading ? <CircularProgress size={18} color="primary" /> : <SendRounded />}
                disabled={loading}
                sx={{mt: 2}}>
                Submit request
              </Button>
            </Box>
          </form>

          <Divider sx={{my: 2}}>Other options</Divider>

          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/*@ts-expect-error*/}
          <Button
            LinkComponent={RouterLink}
            to={'/sign-in'}
            size={'large'}
            startIcon={<SendRounded />}
            sx={{mb: 1}}
            fullWidth>
            Sign in
          </Button>

          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/*@ts-expect-error*/}
          <Button
            LinkComponent={RouterLink}
            to={'/sign-up'}
            size={'large'}
            startIcon={<AppRegistrationRounded />}
            fullWidth>
            Sign up
          </Button>
        </Card.Body>
      </Card>
    </React.Fragment>
  );
};

export default withUnauthentificatedLayout(RequestPasswordReset);
