import {MoreVertRounded} from '@mui/icons-material';
import {
  Button,
  type ButtonProps,
  IconButton,
  IconButtonProps,
  MenuItem,
  MenuItemProps,
  Menu as MuiMenu,
  type MenuProps as MuiMenuProps,
} from '@mui/material';
import React from 'react';

export type TMenuProps = {
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

export const Menu: React.FC<TMenuProps> = ({useIconButton = false, menuProps, actions, ...props}) => {
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
          {...(props as {iconButtonProps?: IconButtonProps}).iconButtonProps}>
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
            key={id + idx}
            {...action}
            onClick={event => {
              action.onClick && action.onClick(event);
              handleClose();
            }}
          />
        ))}
      </MuiMenu>
    </React.Fragment>
  );
};
