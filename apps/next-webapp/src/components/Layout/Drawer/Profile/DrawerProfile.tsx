'use client';

import { LogoutRounded as LogoutIcon } from '@mui/icons-material';
import { Box, Button, type ButtonProps, Chip, Divider, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useRouter } from 'next/navigation';

import { useScreenSize } from '@/hooks/useScreenSize';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';

import { useDrawerStore } from '../Drawer.store';
import { Avatar } from '@/components/User';
import { authClient, signOut } from '@/authClient';
import { useSnackbarContext } from '@/components/Snackbar';

export type DrawerProfileProps = {};

export const DrawerProfile: React.FC<DrawerProfileProps> = () => {
  const theme = useTheme();
  const router = useRouter();
  const screenSize = useScreenSize();
  const { showSnackbar } = useSnackbarContext();
  const { isPending: isSessionPending, data: sessionData } = authClient.useSession();
  const { open, toggle } = useDrawerStore();
  const { breakpoint } = useWindowDimensions();

  const handleLogout = async () => {
    await signOut(
      () => {
        showSnackbar({ message: 'You have been logged out.' });
      },
      () => {
        showSnackbar({
          message: 'Logout failed. Please try again.',
          action: <Button onClick={handleLogout}>Retry</Button>,
        });
      }
    );
  };

  const handleClick = () => {
    if (!open && (breakpoint == 'sm' || breakpoint == 'xs')) {
      toggle();
    }
    router.push('/settings/profile');
  };

  if (!sessionData) return null;
  return (
    <Box sx={{ mt: 'auto', backgroundColor: theme.palette.action.focus }}>
      <Divider />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <Box
          sx={{
            transition: '100ms',
            display: screenSize === 'small' ? (open ? 'none' : 'flex') : open ? 'flex' : 'none',
            flexGrow: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: theme.shape.borderRadius + 'px',
            px: 0.5,
            ':hover': {
              backgroundColor: theme.palette.action.hover,
              cursor: 'Pointer',
            },
          }}
          onClick={handleClick}
        >
          <Avatar />
          <Box sx={{ ml: '.5rem' }}>
            <Typography fontWeight="bold">{sessionData.user.name}</Typography>
            <Chip label={'Basic'} variant="outlined" size="small" />
          </Box>
        </Box>
        <LogoutButton
          onClick={handleLogout}
          sx={{
            ml: open ? 'auto' : '-.5rem',
            ':hover': {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export const LogoutButton: React.FC<ButtonProps> = (props) => {
  const theme = useTheme();
  return (
    <Button
      {...props}
      sx={{
        minWidth: 48,
        width: 48,
        height: 48,
        minHeight: 48,
        p: 0,
        ...props.sx,
      }}
    >
      <LogoutIcon sx={{ color: theme.palette.background.default }} />
    </Button>
  );
};
