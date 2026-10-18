import {Box, Grid, Typography} from '@mui/material';
import {ActionPaper} from '@/components/ActionPaper';
import {LinkButton} from '@/components/Button';
import {Footer} from '@/components/Layout/Footer';
import {UnauthenticatedMain} from '@/components/Layout/Main/UnauthenticatedMain';
import {getAppTranslations} from '@/i18n/server';

export default async function NotFoundPage() {
  const t = await getAppTranslations();
  return (
    <UnauthenticatedMain sx={{display: 'flex'}}>
      <ActionPaper
        sx={{
          mt: 'auto',
          px: 3,
          py: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h1">{t('errors.oops')}</Typography>
        <Typography variant="h2" sx={{mt: 1.5}}>
          {t('errors.pageNotFound')}
        </Typography>

        <Typography sx={{my: 1}}>{t('errors.pageMayHaveBeenRemovedOrMoved')}</Typography>

        <Grid container spacing={2}>
          <Grid size={{xs: 12, md: 4}}>
            <LinkButton href="/" fullWidth>
              {t('navigation.home')}
            </LinkButton>
          </Grid>
          <Grid size={{xs: 12, md: 4}}>
            <LinkButton href="/sign-in" fullWidth>
              {t('auth.signIn.signIn')}
            </LinkButton>
          </Grid>
          <Grid size={{xs: 12, md: 4}}>
            <LinkButton href="/sign-up" fullWidth>
              {t('auth.signUp.signUp')}
            </LinkButton>
          </Grid>
        </Grid>
      </ActionPaper>
      <Box sx={{mt: 'auto'}}>
        <Footer />
      </Box>
    </UnauthenticatedMain>
  );
}
