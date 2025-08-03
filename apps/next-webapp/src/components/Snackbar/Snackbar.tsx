'use client';

import { Snackbar } from '@mui/material';
import React from 'react';

/**
 * Props for showing a snackbar message
 */
export type ShowSnackbarProps = {
  message: string;
  action?: React.ReactNode;
  autoHideDuration?: number;
};

export type SnackbarProps = ShowSnackbarProps & { key: number };

/**
 * Context interface for snackbar operations
 */
export interface ISnackbarContext {
  showSnackbar: (props: ShowSnackbarProps) => void;
}

export const SnackbarContext = React.createContext({} as ISnackbarContext);

/**
 * Hook to use the snackbar context
 * @throws Error if used outside of SnackbarProvider
 */
export function useSnackbarContext() {
  const ctx = React.useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbarContext must be used inside SnackbarProvider');
  }
  return ctx;
}

export const SnackbarProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [snackPack, setSnackPack] = React.useState<readonly SnackbarProps[]>([]);
  const [open, setOpen] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState<SnackbarProps | undefined>(undefined);

  const showSnackbar = React.useCallback((props: ShowSnackbarProps) => {
    setSnackPack((prev) => [
      ...prev,
      {
        message: props.message,
        action: props.action,
        autoHideDuration: props.autoHideDuration || 2000,
        key: new Date().getTime(),
      },
    ]);
  }, []);

  const handleClose = React.useCallback((_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  const handleExited = React.useCallback(() => {
    setMessageInfo(undefined);
  }, []);

  React.useEffect(() => {
    if (snackPack.length && !messageInfo) {
      // Set a new snack when we don't have an active one
      setMessageInfo({ ...snackPack[0] });
      setSnackPack((prev) => prev.slice(1));
      setOpen(true);
    } else if (snackPack.length && messageInfo && open) {
      // Close an active snack when a new one is added
      setOpen(false);
    }
  }, [snackPack, messageInfo, open]);

  const contextValue = React.useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        key={messageInfo?.key}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={open}
        autoHideDuration={messageInfo?.autoHideDuration || 2000}
        onClose={handleClose}
        message={messageInfo?.message}
        // REVISIT: Update TransitionProps before production
        TransitionProps={{ onExited: handleExited }}
      />
    </SnackbarContext.Provider>
  );
};
