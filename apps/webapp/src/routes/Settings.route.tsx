import {Box, Grid2 as Grid, Typography} from '@mui/material';
import React from 'react';

import {AppConfig, Feature} from '@/app.config';
import {Card} from '@/components/Base/Card';
import {isFeatureEnabled} from '@/components/Feature';
import {PageHeader} from '@/components/Layout';
import {AppInformation, EditProfile} from '@/components/Settings';
import {UserAvatar} from '@/components/User';
import {useAuthContext} from '@/features/Auth';
import {withAuthLayout} from '@/features/Auth';
import {SubscribeToNewsletters} from '@/features/Newsletter';

export type TSettingsRouteProps = unknown;

const SettingsRoute: React.FC<TSettingsRouteProps> = () => {
  const {sessionUser} = useAuthContext();

  if (!sessionUser) return null;
  return (
    <Grid container spacing={AppConfig.baseSpacing}>
      <PageHeader title="Settings" />

      <Grid size={{xs: 12}}>
        <Card sx={{p: 0}} className="test">
          <Card.Header
            sx={{
              position: 'relative',
              p: 0,
              aspectRatio: {xs: '6/2', md: '9/1'},
              backgroundSize: '100%',
              borderRadius: 'inherit',
            }}>
            <Box
              sx={{
                display: 'flex',
                m: {xs: 2, md: 4},
              }}>
              <UserAvatar
                sx={{
                  width: {xs: 64, md: 96},
                  height: {xs: 64, md: 96},
                }}
              />

              <Box sx={{mt: 'auto', mb: {xs: 0, md: 2}, ml: 1}}>
                <Typography variant="h2">
                  {sessionUser.name && sessionUser.surname
                    ? `${sessionUser.name} ${sessionUser.surname}`
                    : sessionUser.username}
                </Typography>
                <Typography variant="body1" fontWeight="bolder">
                  {sessionUser.email}
                </Typography>
              </Box>
            </Box>
          </Card.Header>
        </Card>
      </Grid>

      <Grid container size={{xs: 12, md: 4, xl: 3}} order={{xs: 1, md: 0}}>
        <Grid size={{xs: 12}}>
          <AppInformation />
        </Grid>
      </Grid>

      <Grid container size={{xs: 12, md: 8, xl: 9}} order={{xs: 0, md: 1}} spacing={AppConfig.baseSpacing}>
        <Grid size={{xs: 12, md: 7}}>
          <EditProfile />
        </Grid>

        {isFeatureEnabled(Feature.NEWSLETTER) && (
          <Grid size={{xs: 12, md: 5}}>
            <SubscribeToNewsletters />
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default withAuthLayout(SettingsRoute);
