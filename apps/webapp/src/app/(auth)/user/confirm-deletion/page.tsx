import {Grid, Stack, Typography} from '@mui/material';
import {Brand} from '@/components/Brand';
import {Card} from '@/components/Card';
import {getAppTranslations} from '@/lib/i18n/server';

export default async function ConfirmUserDeletionPage() {
  const t = await getAppTranslations();
  return (
    <Grid
      container
      sx={{
        justifyContent: 'center',
      }}
    >
      <Grid size={{xs: 12, md: 4, xl: 3.5}}>
        <Card sx={{py: 3, px: 4}}>
          <Card.Header>
            <Stack direction={'column'}></Stack>

            <Brand logoSize={96} logoStyle={{borderRadius: '5px'}} boxStyle={{mx: 'auto'}} />

            <Typography
              variant={'h5'}
              sx={{
                textAlign: 'center',
                fontWeight: 'bolder',
                mt: 2,
              }}
            >
              {t('Your account was deleted')}
            </Typography>
          </Card.Header>

          <Card.Header>
            <Typography variant="body1" gutterBottom>
              {t(
                "We're sorry to see you go. Your account deletion request has been received and is being processed. Please note that it may take up to 60 days for all of your data to be completely erased.",
              )}
            </Typography>
          </Card.Header>
        </Card>
      </Grid>
    </Grid>
  );
}
