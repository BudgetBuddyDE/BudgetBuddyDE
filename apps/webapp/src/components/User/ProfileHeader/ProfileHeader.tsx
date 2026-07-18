'use client';

import SettingsRounded from '@mui/icons-material/SettingsRounded';
import VpnKeyRounded from '@mui/icons-material/VpnKeyRounded';
import {Box, Stack, Tab, Tabs, Typography} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {authClient} from '@/authClient';
import {Avatar} from '../Avatar';
import styles from './ProfileHeader.module.css';

const TABS = [
  {label: 'Profile', icon: <SettingsRounded />, path: '/settings/profile'},
  {label: 'API Keys', icon: <VpnKeyRounded />, path: '/settings/api-keys'},
];

export const ProfileHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = TABS.findIndex(tab => pathname.startsWith(tab.path));
  const {isPending, data, error} = authClient.useSession();

  if (error) throw error;
  if (isPending || !data) return null;
  return (
    <Box className={styles.profileHeader} sx={{borderRadius: theme => `${theme.shape.borderRadius}px`}}>
      <Stack flexDirection={'row'} gap={2}>
        <Box sx={{ml: 4, my: 4}}>
          <Avatar
            sx={{
              width: {xs: 64, md: 96},
              height: {xs: 64, md: 96},
            }}
          />
        </Box>
        <Stack sx={{mt: 4}}>
          <Box sx={{mt: 'auto'}}>
            <Typography variant="h5" fontWeight="bolder">
              {data.user.name}
            </Typography>
            <Typography variant="body2" fontWeight="bolder">
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
                  label={tab.label}
                />
              ))}
            </Tabs>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};
