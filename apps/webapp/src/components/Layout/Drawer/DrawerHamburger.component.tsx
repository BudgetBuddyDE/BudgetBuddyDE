import {MenuRounded as MenuIcon, MenuOpenRounded as MenuOpenIcon} from '@mui/icons-material';
import {IconButton, type IconButtonProps} from '@mui/material';
import React from 'react';

import {useScreenSize} from '@/hooks/useScreenSize';

import {useDrawerStore} from './Drawer.store';

export type TDrawerHeaderProps = IconButtonProps;

export const DrawerHamburger: React.FC<TDrawerHeaderProps> = ({...iconButtonProps}) => {
  const screenSize = useScreenSize();
  const {open, toggle} = useDrawerStore();
  return (
    <IconButton onClick={() => toggle()} {...iconButtonProps}>
      <Icon open={open} screenSize={screenSize} />
    </IconButton>
  );
};

const Icon: React.FC<{open: boolean; screenSize: ReturnType<typeof useScreenSize>}> = ({open, screenSize}) => {
  if (screenSize === 'small') {
    return open ? <MenuIcon /> : <MenuOpenIcon />;
  } else return open ? <MenuOpenIcon /> : <MenuIcon />;
};
