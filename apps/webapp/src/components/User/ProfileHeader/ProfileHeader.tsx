'use client';

import {SettingsRounded, VpnKeyRounded} from '@mui/icons-material';
import {Box, Stack, Tab, Tabs, Typography} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {authClient} from '@/authClient';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {Avatar} from '../Avatar';

const TABS = [
  {labelKey: 'account.profile.profile', icon: <SettingsRounded />, path: '/settings/profile'},
  {labelKey: 'account.apiKeys.apiKeys', icon: <VpnKeyRounded />, path: '/settings/api-keys'},
] as const;

export const ProfileHeader = () => {
  const t = useAppTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = TABS.findIndex(tab => pathname.startsWith(tab.path));
  const {isPending, data, error} = authClient.useSession();

  if (error) throw error;
  if (isPending || !data) return null;
  return (
    <Box
      sx={theme => ({
        '--profile-header-size': '84px',
        // @ts-expect-error
        '--profile-header-color-1': theme.palette.primary[700],
        // @ts-expect-error
        '--profile-header-color-2': theme.palette.primary[800],
        // @ts-expect-error
        '--profile-header-color-3': theme.palette.primary[900],
        '--profile-header-gradient-stops': '0 120deg, #0000 0',
        borderRadius: `${theme.shape.borderRadius}px`,
        background: `
          conic-gradient(from 0deg at calc(500% / 6) calc(100% / 3), var(--profile-header-color-3) var(--profile-header-gradient-stops)),
          conic-gradient(from -120deg at calc(100% / 6) calc(100% / 3), var(--profile-header-color-2) var(--profile-header-gradient-stops)),
          conic-gradient(from 120deg at calc(100% / 3) calc(500% / 6), var(--profile-header-color-1) var(--profile-header-gradient-stops)),
          conic-gradient(from 120deg at calc(200% / 3) calc(500% / 6), var(--profile-header-color-1) var(--profile-header-gradient-stops)),
          conic-gradient(from -180deg at calc(100% / 3) 50%, var(--profile-header-color-2) 60deg, var(--profile-header-color-1) var(--profile-header-gradient-stops)),
          conic-gradient(from 60deg at calc(200% / 3) 50%, var(--profile-header-color-1) 60deg, var(--profile-header-color-3) var(--profile-header-gradient-stops)),
          conic-gradient(from -60deg at 50% calc(100% / 3), var(--profile-header-color-1) 120deg, var(--profile-header-color-2) 0 240deg, var(--profile-header-color-3) 0)
        `,
        backgroundSize: 'calc(var(--profile-header-size) * 1.732) var(--profile-header-size)',
      })}
    >
      <Stack direction="row" spacing={2}>
        <Box sx={{pl: {xs: 2, md: 4}, py: {xs: 2, md: 4}}}>
          <Avatar
            sx={{
              width: {xs: 64, md: 96},
              height: {xs: 64, md: 96},
            }}
          />
        </Box>
        <Stack sx={{pt: {xs: 2, md: 4}}}>
          <Box sx={{mt: 'auto'}}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bolder',
              }}
            >
              {data.user.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 'bolder',
              }}
            >
              {data.user.email}
            </Typography>
          </Box>
          <Box sx={{mt: 'auto'}}>
            <Tabs
              value={currentTab >= 0 ? currentTab : 0}
              onChange={(_, newValue) => {
                router.push(TABS[newValue].path);
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {TABS.map(tab => (
                <Tab
                  key={tab.path}
                  // icon={tab.icon}
                  iconPosition="start"
                  label={t(tab.labelKey)}
                />
              ))}
            </Tabs>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};
