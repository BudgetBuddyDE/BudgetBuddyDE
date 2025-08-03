'use client';

import { LogoutRounded as LogoutIcon, SettingsRounded as SettingsIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  AppBar as MuiAppBar,
  Toolbar,
  Tooltip,
} from '@mui/material';
import React from 'react';
import { useRouter } from 'next/navigation';

import { Brand } from '@/components/Brand';

import { Avatar } from '@/components/User';
import { DrawerHamburger } from '../Drawer/Hamburger';
import { signOut } from '@/authClient';
import { useSnackbarContext } from '@/components/Snackbar';

export const AppBar = () => {
  const router = useRouter();
  const { showSnackbar } = useSnackbarContext();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const MenuLinks = [
    { label: 'Website', href: 'https://budgetbuddy.dev' },
    { label: 'GitHub', href: 'https://github.com/BudgetBuddyDE' },
  ];

  const handleLogOut = async () => {
    await signOut(
      () => {
        showSnackbar({ message: 'You have been logged out.' });
      },
      () => {
        showSnackbar({
          message: 'Logout failed. Please try again.',
          action: <Button onClick={handleLogOut}>Retry</Button>,
        });
      }
    );
  };

  const ProfileMenu = [
    {
      icon: <SettingsIcon />,
      label: 'Settings',
      onClick: () => router.push('/settings/profile'),
    },
    {
      icon: <LogoutIcon />,
      label: 'Logout',
      onClick: handleLogOut,
    },
  ];

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <MuiAppBar
      position="sticky"
      elevation={0}
      sx={{ border: 0, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop: Brand */}
          <Brand asLink boxStyle={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />

          {/* Menu: Mobile */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <DrawerHamburger size="large" />
          </Box>

          {/* Mobile: Brand */}
          <Brand asLink boxStyle={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }} />

          {/* Menu: Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, marginLeft: 'auto', marginRight: 2 }}>
            {MenuLinks.map((page) => (
              <Button
                key={page.label}
                href={page.href}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.label}
              </Button>
            ))}
          </Box>

          {/* Profile */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Profile">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar />
              </IconButton>
            </Tooltip>
            <Menu
              elevation={1}
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {ProfileMenu.map((item) => (
                <MenuItem
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    handleCloseUserMenu();
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
};
