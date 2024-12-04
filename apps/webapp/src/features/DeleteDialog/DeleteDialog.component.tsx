import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  type DialogProps as MuiDialogProps,
} from '@mui/material';
import React from 'react';

import {Transition} from '@/components/Transition';

export type TDeleteDialogProps = Pick<
  MuiDialogProps,
  'open' | 'onClose' | 'maxWidth' | 'TransitionComponent' | 'TransitionProps' | 'transitionDuration'
> & {
  onCancel: () => void;
  onConfirm: () => void;
  withTransition?: boolean;
};

/**
 * DeleteDialog component renders a confirmation dialog for deleting entries.
 *
 * @component
 * @param {TDeleteDialogProps} props - The properties for the DeleteDialog component.
 * @param {boolean} props.open - Controls whether the dialog is open.
 * @param {function} props.onClose - Callback fired when the dialog is requested to be closed.
 * @param {string} [props.maxWidth='xs'] - Specifies the max-width of the dialog.
 * @param {function} props.onCancel - Callback fired when the cancel button is clicked.
 * @param {function} props.onConfirm - Callback fired when the confirm button is clicked.
 * @param {boolean} [props.withTransition=false] - Determines if the dialog should use a transition.
 * @param {object} [props.transitionProps] - Additional props to pass to the transition component.
 * @returns {JSX.Element} The rendered DeleteDialog component.
 */
export const DeleteDialog: React.FC<TDeleteDialogProps> = ({
  open,
  onClose,
  maxWidth = 'xs',
  onCancel,
  onConfirm,
  withTransition = false,
  ...transitionProps
}) => {
  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (onClose) onClose(event, reason);
      }}
      maxWidth={maxWidth}
      PaperProps={{elevation: 0}}
      {...transitionProps}
      TransitionComponent={
        withTransition
          ? !transitionProps.TransitionComponent
            ? Transition
            : transitionProps.TransitionComponent
          : undefined
      }>
      <DialogTitle variant="h2" textAlign="center">
        Attention
      </DialogTitle>
      <DialogContent>
        <DialogContentText variant="inherit" textAlign="center">
          Are you sure you want to delete these entries?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          Yes, delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
