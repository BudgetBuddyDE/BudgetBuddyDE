import {AlternateEmailRounded, AppSettingsAltRounded, CodeRounded, LanguageRounded} from '@mui/icons-material';
import {Box, Link, Stack, Typography} from '@mui/material';
import NextLink from 'next/link';

import {Card} from '@/components/Card';

export const AppInformation = () => {
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>App information</Card.Title>
          <Card.Subtitle>
            ReactJS bases web-app to keep track of your finances and manage your montly budget.
          </Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Stack spacing={2} direction="row" alignItems="center" sx={{mt: 1}}>
          <LanguageRounded />
          <Link component={NextLink} href="https://budget-buddy.de" target="_blank">
            Website
          </Link>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center" sx={{mt: 1}}>
          <AlternateEmailRounded />
          <Link component={NextLink} href="mailto:contact@budget-buddy.de">
            Contact
          </Link>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center" sx={{mt: 1}}>
          <CodeRounded />
          <Link component={NextLink} href="https://github.com/BudgetBuddyDE/BudgetBuddyDE" target="_blank">
            Source Code
          </Link>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center" sx={{mt: 1}}>
          <AppSettingsAltRounded />
          <Typography noWrap>Version {process.env.NEXT_PUBLIC_APP_VERSION}</Typography>
        </Stack>
      </Card.Body>
    </Card>
  );
};
