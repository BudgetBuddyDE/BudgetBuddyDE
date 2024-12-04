import {CloseRounded, DoneRounded, ErrorRounded} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  type DrawerProps,
  IconButton,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import React from 'react';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {type TFormDrawerState} from '@/components/Drawer';
import {useKeyPress} from '@/hooks/useKeyPress';
import {useScreenSize} from '@/hooks/useScreenSize';
import {drawerWidth} from '@/style/theme/theme';
import {determineOS} from '@/utils';

/**
 * @deprecated
 */
export type TFormDrawerProps = {
  state?: TFormDrawerState;
  open?: boolean;
  heading?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  closeOnBackdropClick?: boolean;
};

/**
 * @deprecated
 */
export const FormDrawer: React.FC<React.PropsWithChildren<TFormDrawerProps>> = ({
  state,
  open,
  onClose,
  onSubmit,
  closeOnBackdropClick = false,
  heading = 'Drawer',
  children,
}) => {
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const saveBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const screenSize = useScreenSize();

  useKeyPress(
    ['s'],
    e => {
      if (saveBtnRef.current) {
        e.preventDefault();
        saveBtnRef.current.click();
      }
    },
    drawerRef.current,
    true,
  );

  const iOS = determineOS(navigator.userAgent) === 'iOS';

  const DrawerAnchor: DrawerProps['anchor'] = React.useMemo(() => {
    return screenSize === 'small' ? 'bottom' : 'right';
  }, [screenSize]);

  const Content = () => (
    <React.Fragment>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          pb: 0,
        }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {heading}
        </Typography>
        <ActionPaper>
          <IconButton color="primary" onClick={onClose}>
            <CloseRounded />
          </IconButton>
        </ActionPaper>
      </Box>
      <form onSubmit={onSubmit} style={{display: 'flex', flexDirection: 'column', height: 'inherit'}}>
        <Box sx={{p: 2}}>
          {state && state.error && (
            <Alert severity="error" sx={{mb: 2}}>
              {state.error instanceof Error ? state.error.message : state.error}
            </Alert>
          )}
          {children}
        </Box>
        <Box sx={{mt: 'auto'}}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              p: 2,
              pt: 0,
            }}>
            <Button onClick={onClose} sx={{mr: 2}} tabIndex={2}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              ref={saveBtnRef}
              {...(state !== undefined
                ? {
                    startIcon: state.loading ? (
                      <CircularProgress color="inherit" size={16} />
                    ) : state.success ? (
                      <DoneRounded color="inherit" fontSize="inherit" />
                    ) : !state.success && state.error !== null ? (
                      <ErrorRounded color="inherit" fontSize="inherit" />
                    ) : null,
                    disabled: state.loading,
                  }
                : {})}
              tabIndex={1}>
              Save
            </Button>
          </Box>
        </Box>
      </form>
    </React.Fragment>
  );

  return DrawerAnchor === 'right' ? (
    <Drawer
      ref={drawerRef}
      open={open}
      anchor={DrawerAnchor}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' && closeOnBackdropClick) {
          if (onClose) onClose();
        }
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          boxSizing: 'border-box',
          width: drawerWidth * 2,
        },
      }}
      children={<Content />}
    />
  ) : (
    <SwipeableDrawer
      anchor={'bottom'}
      open={open}
      onOpen={() => {}}
      onClose={() => {
        if (onClose) onClose();
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderTopLeftRadius: theme => `${theme.shape.borderRadius}px`,
          borderTopRightRadius: theme => `${theme.shape.borderRadius}px`,
        },
      }}
      children={<Content />}
      /**
       * The following properties are used for optimal usability of the component:
       * - iOS is hosted on high-end devices. The backdrop transition can be enabled without dropping frames. The performance will be good enough.
       * - iOS has a "swipe to go back" feature that interferes with the discovery feature, so discovery has to be disabled.
       */
      disableBackdropTransition={!iOS}
      disableDiscovery={iOS}
    />
  );
};
