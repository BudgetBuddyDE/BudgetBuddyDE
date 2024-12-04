import {type TStockPositionWithQuote} from '@budgetbuddyde/types';
import {DeleteRounded, EditRounded, MoreVertRounded} from '@mui/icons-material';
import {IconButton, ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material';
import React from 'react';

import {type TStockPositionTableProps} from '../StockPositionTable';

export const StockPositionMenu: React.FC<
  Pick<TStockPositionTableProps, 'onEditPosition' | 'onDeletePosition'> & {position: TStockPositionWithQuote}
> = ({position, onEditPosition, onDeletePosition}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handler = {
    openMenu(event: React.MouseEvent<HTMLElement>) {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    },
    onClose(event: React.SyntheticEvent<HTMLElement>) {
      event.stopPropagation();
      setAnchorEl(null);
    },
  };

  return (
    <React.Fragment>
      <IconButton color="primary" onClick={handler.openMenu}>
        <MoreVertRounded />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handler.onClose}
        elevation={2}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        slotProps={{paper: {sx: {boxShadow: 'none', border: theme => `1px solid ${theme.palette.divider}`}}}}>
        {onEditPosition && (
          <MenuItem
            onClick={e => {
              handler.onClose(e);
              onEditPosition(position);
            }}>
            <ListItemIcon>
              <EditRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {onDeletePosition && (
          <MenuItem
            onClick={e => {
              handler.onClose(e);
              onDeletePosition(position);
            }}>
            <ListItemIcon>
              <DeleteRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </React.Fragment>
  );
};
