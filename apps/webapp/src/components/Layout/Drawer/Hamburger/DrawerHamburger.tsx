'use client';

import {IconButton, SvgIcon, type IconButtonProps} from '@mui/material';
import type React from 'react';

import {useScreenSize} from '@/hooks/useScreenSize';

import {useDrawerContext} from '../DrawerContext';

export type DrawerHeaderProps = IconButtonProps;

export const DrawerHamburger: React.FC<DrawerHeaderProps> = ({...iconButtonProps}) => {
  const screenSize = useScreenSize();
  const {isOpen, toggleVisibility} = useDrawerContext();

  const open = isOpen(screenSize);

  return (
    <IconButton
      aria-label="Toggle navigation"
      aria-expanded={open}
      onClick={() => toggleVisibility(screenSize)}
      {...iconButtonProps}
    >
      <SvgIcon viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M9 4.5v15" fill="none" stroke="currentColor" strokeWidth="2" />
        {open ? (
          <path
            d="m16 9-3 3 3 3"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        ) : (
          <path
            d="m13 9 3 3-3 3"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        )}
      </SvgIcon>
    </IconButton>
  );
};
