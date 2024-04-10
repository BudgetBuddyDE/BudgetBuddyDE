import React from 'react';
import {withUnauthentificatedLayout} from '@/components/Auth/Layout';
import {Card} from '@/components/Base';
import {Button, Typography} from '@mui/material';
import {ExitToAppRounded} from '@mui/icons-material';
import {AppLogo} from '@/components/AppLogo.component';
import {useAuthContext} from '@/components/Auth';

const VerifyMail = () => {
  const {sessionUser, logout} = useAuthContext();
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
          px: 3,
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
            Verify E-Mail address
          </Typography>
        </Card.Header>
        <Card.Body>
          <Typography variant="h2" sx={{mt: 1}}>
            This feature is currently not available!
          </Typography>
        </Card.Body>
      </Card>
    </React.Fragment>
  );
};

export default withUnauthentificatedLayout(VerifyMail);
