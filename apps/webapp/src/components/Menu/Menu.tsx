'use client';

import {MoreVertRounded} from '@mui/icons-material';
import {
  Button,
  type ButtonProps,
  IconButton,
  type IconButtonProps,
  MenuItem,
  type MenuItemProps,
  Menu as MuiMenu,
  type MenuProps as MuiMenuProps,
} from '@mui/material';
import React from 'react';

export type MenuProps = {
  menuProps?: MuiMenuProps;
  actions: MenuItemProps[];
} & (
  | {
      useIconButton: true;
      iconButtonProps?: IconButtonProps;
    }
  | {
      useIconButton?: false;
      buttonProps?: ButtonProps;
    }
);

export const Menu: React.FC<MenuProps> = ({useIconButton = false, menuProps, actions, ...props}) => {
  const id = React.useId();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <React.Fragment>
      {useIconButton ? (
        <IconButton
          onClick={handleClick}
          color="primary"
          {...(props as {iconButtonProps?: IconButtonProps}).iconButtonProps}
        >
          <MoreVertRounded />
        </IconButton>
      ) : (
        <Button onClick={handleClick} {...(props as {buttonProps?: ButtonProps}).buttonProps}>
          Menu
        </Button>
      )}
      <MuiMenu anchorEl={anchorEl} onClose={handleClose} {...menuProps} open={open}>
        {actions.map((action, idx) => (
          <MenuItem
            // biome-ignore lint/suspicious/noArrayIndexKey: It's fine here
            key={`${id}-action-${idx}`}
            {...action}
            onClick={event => {
              action.onClick?.(event);
              handleClose();
            }}
          />
        ))}
      </MuiMenu>
    </React.Fragment>
  );
};
