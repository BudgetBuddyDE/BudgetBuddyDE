import AlternateEmailRounded from '@mui/icons-material/AlternateEmailRounded';
import AppSettingsAltRounded from '@mui/icons-material/AppSettingsAltRounded';
import CodeRounded from '@mui/icons-material/CodeRounded';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import {Box, Link, Stack, Typography} from '@mui/material';
import {useTranslations} from 'next-intl';

import {Card} from '@/components/Card';
import {webappConfig} from '@/config';

export const AppInformation = () => {
  const t = useTranslations('AppInformation');
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>{t('title')}</Card.Title>
          <Card.Subtitle>{t('description')}</Card.Subtitle>
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
            {t('website')}
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
          <Link href="mailto:contact@budget-buddy.de">{t('contact')}</Link>
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
            {t('sourceCode')}
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
          <Typography noWrap>{t('version', {version: webappConfig.version})}</Typography>
        </Stack>
      </Card.Body>
    </Card>
  );
};
