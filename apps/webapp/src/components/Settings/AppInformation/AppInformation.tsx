'use client';

import AlternateEmailRounded from '@mui/icons-material/AlternateEmailRounded';
import AppSettingsAltRounded from '@mui/icons-material/AppSettingsAltRounded';
import CodeRounded from '@mui/icons-material/CodeRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import {Box, Link, Stack, Typography} from '@mui/material';

import {Card} from '@/components/Card';
import {webappConfig} from '@/config';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export const AppInformation = () => {
  const t = useAppTranslations();
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>{t('settings.appInformation.appInformation')}</Card.Title>
          <Card.Subtitle>
            {t('settings.appInformation.reactjsBasesWebAppToKeepTrackOfYourFinancesAndManageYourMontlyBudget')}
          </Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Stack
          spacing={2}
          direction="row"
          sx={{
            alignItems: 'center',
            mt: 1,
          }}
        >
          <LanguageRounded />
          <Link href="https://budget-buddy.de" target="_blank">
            {t('settings.appInformation.website')}
          </Link>
        </Stack>

        <Stack
          spacing={2}
          direction="row"
          sx={{
            alignItems: 'center',
            mt: 1,
          }}
        >
          <AlternateEmailRounded />
          <Link href="mailto:contact@budget-buddy.de">{t('settings.appInformation.contact')}</Link>
        </Stack>

        <Stack
          spacing={2}
          direction="row"
          sx={{
            alignItems: 'center',
            mt: 1,
          }}
        >
          <CodeRounded />
          <Link href="https://github.com/BudgetBuddyDE/BudgetBuddyDE" target="_blank">
            {t('settings.appInformation.sourceCode')}
          </Link>
        </Stack>

        <Stack
          spacing={2}
          direction="row"
          sx={{
            alignItems: 'center',
            mt: 1,
          }}
        >
          <AppSettingsAltRounded />
          <Typography noWrap>{t('settings.appInformation.versionVersion', {version: webappConfig.version})}</Typography>
        </Stack>
      </Card.Body>
    </Card>
  );
};
