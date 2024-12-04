import {ExitToAppRounded, HomeRounded} from '@mui/icons-material';
import {Grid2 as Grid, Link, Typography} from '@mui/material';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {StackedIconButton} from '@/components/StackedIconButton/StackedIconButton.component';
import {withUnauthentificatedLayout} from '@/features/Auth';
import {useAuthContext} from '@/features/Auth';
import {useDocumentTitle} from '@/hooks/useDocumentTitle';

const PageNotFound = () => {
  useDocumentTitle('Page not Found', true);
  const {sessionUser} = useAuthContext();
  return (
    <Grid container justifyContent={'center'}>
      <Grid size={{xs: 12, md: 4, xl: 3}}>
        <ActionPaper
          sx={{
            px: 3,
            py: 2,
            textAlign: 'center',
          }}>
          <Typography variant="h1">Ooops!</Typography>
          <Typography variant="h2" sx={{mt: 1.5}}>
            Page Not Found
          </Typography>

          <Typography sx={{my: 1}}>The page you are looking for might have been removed or moved.</Typography>

          <Grid container spacing={AppConfig.baseSpacing / 2}>
            {sessionUser && (
              <Grid size={{xs: 6}}>
                <StackedIconButton
                  component={Link}
                  href="/"
                  // to="/dashboard"
                  size="large"
                  startIcon={<HomeRounded />}
                  sx={{width: '100%'}}>
                  Dashboard
                </StackedIconButton>
              </Grid>
            )}
            <Grid size={{xs: 6}}>
              <StackedIconButton component={Link} href="/sign-in" size="large" startIcon={<ExitToAppRounded />}>
                Sign-in
              </StackedIconButton>
            </Grid>
          </Grid>
        </ActionPaper>
      </Grid>
    </Grid>
  );
};

export default withUnauthentificatedLayout(PageNotFound);
