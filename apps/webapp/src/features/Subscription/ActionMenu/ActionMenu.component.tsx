import {type TSubscription} from '@budgetbuddyde/types';
import {CompareArrowsRounded, MoreVertRounded, PauseRounded, PlayArrowRounded} from '@mui/icons-material';
import {IconButton, ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material';
import React from 'react';

export type TSubscriptionActionMenuProps = {
  subscription: TSubscription;
  onToggleExecutionState: (subscription: TSubscription) => void;
  onCreateTransaction: (subscription: TSubscription) => void;
};

export const SubscriptionActionMenu: React.FC<TSubscriptionActionMenuProps> = ({
  subscription,
  onToggleExecutionState,
  onCreateTransaction,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handler = {
    onClick(event: React.MouseEvent<HTMLElement>) {
      setAnchorEl(event.currentTarget);
    },
    onClose() {
      setAnchorEl(null);
    },
    async toggleExecutionState() {
      handler.onClose();
      onToggleExecutionState(subscription);
    },
    onCreateTransaction() {
      handler.onClose();
      onCreateTransaction(subscription);
    },
  };

  return (
    <React.Fragment>
      <IconButton color="primary" onClick={handler.onClick}>
        <MoreVertRounded />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handler.onClose} elevation={0}>
        <MenuItem onClick={handler.toggleExecutionState}>
          <ListItemIcon>
            {subscription.paused ? <PlayArrowRounded fontSize="small" /> : <PauseRounded fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{subscription.paused ? 'Resume' : 'Pause'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handler.onCreateTransaction}>
          <ListItemIcon>
            <CompareArrowsRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText>Transaction</ListItemText>
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
};
