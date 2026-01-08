'use client';

import {FolderRounded} from '@mui/icons-material';
import {Divider, List, ListSubheader, Drawer as MuiDrawer} from '@mui/material';
import React from 'react';
import {useDrawerContext} from './DrawerContext';
import {DrawerHeader} from './Header';
import {DrawerItem} from './Item';
import {DrawerLinks} from './Links/DrawerLinks';
import {DrawerProfile} from './Profile/DrawerProfile';
import {StyledDrawer} from './StyledDrawer';

/**
 * We're inverting the showDrawer-value on mobile devices because it should be hidden by default on mobile devices for better UX
 */
export const Drawer = () => {
  const {isOpen, toggleVisibility} = useDrawerContext();
  const DrawerItems: React.FC<{open: boolean; closeOnClick?: boolean}> = ({open, closeOnClick = false}) => {
    return (
      <React.Fragment>
        <Divider />
        <List>
          {DrawerLinks.map(link => (
            <DrawerItem key={link.path} open={open} {...link} closeOnClick={closeOnClick} />
          ))}
        </List>
        <List
          component="nav"
          aria-labelledby="other-subheader"
          subheader={
            <ListSubheader component="div" id="other-subheader">
              {/* Show placeholder text (invisible char) when drawer is open to avoid layout shift */}
              {open ? 'Other' : '\u2006'}
            </ListSubheader>
          }
        >
          <DrawerItem
            open={open}
            icon={<FolderRounded />}
            text="Attachments"
            path="/attachments"
            closeOnClick={closeOnClick}
          />
        </List>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      {/* Mobile */}
      <MuiDrawer
        variant="temporary"
        open={isOpen('small')}
        onClose={(_ev, reason) => reason === 'backdropClick' && toggleVisibility()}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        slotProps={{
          paper: {
            elevation: 0,
          },
        }}
        sx={{
          display: {xs: 'block', md: 'none'},
          '& .MuiDrawer-paper': {width: '80%'},
        }}
      >
        <DrawerHeader />
        <DrawerItems open={isOpen('small')} closeOnClick />
        <DrawerProfile />
      </MuiDrawer>

      {/* Desktop */}
      <StyledDrawer
        variant="permanent"
        open={isOpen('medium')}
        sx={{display: {xs: 'none', md: 'unset'}}}
        ModalProps={{
          keepMounted: true, // Better open performance
        }}
      >
        <DrawerHeader />
        <DrawerItems open={isOpen('medium')} />
        <DrawerProfile />
      </StyledDrawer>
    </React.Fragment>
  );
};
