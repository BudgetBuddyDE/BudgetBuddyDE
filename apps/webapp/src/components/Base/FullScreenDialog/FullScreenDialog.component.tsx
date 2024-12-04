import {CloseRounded} from '@mui/icons-material';
import {
  AppBar,
  Box,
  type BoxProps,
  Dialog,
  DialogActions,
  type DialogActionsProps,
  DialogContent,
  type DialogContentProps,
  type DialogProps,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import React from 'react';

import {Transition} from '@/components/Transition';

export type TFullScreenDialogProps = DialogProps & {
  title: string;
  onClose: () => void;
  appBarActions?: React.ReactNode;
  boxProps?: BoxProps;
  dialogActionsProps?: DialogActionsProps;
  dialogContentProps?: DialogContentProps;
  wrapInDialogContent?: boolean;
};

export const FullScreenDialog: React.FC<TFullScreenDialogProps> = ({
  title,
  onClose,
  appBarActions,
  boxProps,
  dialogActionsProps,
  dialogContentProps,
  wrapInDialogContent = false,
  ...dialogProps
}) => {
  const Content = (
    <React.Fragment>
      <AppBar
        elevation={0}
        sx={{position: 'relative', border: 0, borderBottom: theme => `1px solid ${theme.palette.divider}`}}>
        <Toolbar sx={{border: 'none'}}>
          <Typography
            sx={{
              flex: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
            variant="h5"
            component="div">
            {title}
          </Typography>

          {appBarActions}
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseRounded />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box {...boxProps} sx={{m: 3, flex: 1, ...boxProps?.sx}}>
        {dialogProps.children}
      </Box>
    </React.Fragment>
  );

  return (
    <Dialog fullScreen TransitionComponent={Transition} PaperProps={{elevation: 0}} {...dialogProps}>
      {wrapInDialogContent ? <DialogContent {...dialogContentProps}>{Content}</DialogContent> : Content}

      {dialogActionsProps && (
        <DialogActions
          {...dialogActionsProps}
          sx={{
            border: 0,
            borderTop: theme => `1px solid ${theme.palette.divider}`,
            px: 4,
            py: 2,
            ...dialogActionsProps.sx,
          }}
        />
      )}
    </Dialog>
  );
};
