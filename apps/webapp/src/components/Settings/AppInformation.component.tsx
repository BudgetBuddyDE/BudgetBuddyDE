import {AlternateEmailRounded, AppSettingsAltRounded, CodeRounded, LanguageRounded} from '@mui/icons-material';
import {Box, Stack, Typography} from '@mui/material';

import {AppConfig} from '@/app.config';
import {Card} from '@/components/Base/Card';

import {StyledLink} from '../Base/Link';

export const AppInformation = () => {
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>About</Card.Title>
          <Card.Subtitle>
            ReactJS bases web-app to keep track of your finances and manage your montly budget.
          </Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Stack spacing={AppConfig.baseSpacing} direction="row" alignItems="center" sx={{mt: 1}}>
          <LanguageRounded />
          <StyledLink href="https://budget-buddy.de" target="_blank">
            Website
          </StyledLink>
        </Stack>

        <Stack spacing={AppConfig.baseSpacing} direction="row" alignItems="center" sx={{mt: 1}}>
          <AlternateEmailRounded />
          <StyledLink href="mailto:contact@budget-buddy.de">Contact</StyledLink>
        </Stack>

        <Stack spacing={AppConfig.baseSpacing} direction="row" alignItems="center" sx={{mt: 1}}>
          <CodeRounded />
          <StyledLink href="https://github.com/BudgetBuddyDE/Webapp" target="_blank">
            Source Code
          </StyledLink>
        </Stack>

        <Stack spacing={AppConfig.baseSpacing} direction="row" alignItems="center" sx={{mt: 1}}>
          <AppSettingsAltRounded />
          <Typography noWrap>Version v{AppConfig.version}</Typography>
        </Stack>
      </Card.Body>
    </Card>
  );
};
