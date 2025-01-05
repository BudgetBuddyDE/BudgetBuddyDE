import {
  Drawer as MuiDrawer,
  type DrawerProps as MuiDrawerProps,
  SwipeableDrawer,
  type SwipeableDrawerProps,
} from '@mui/material';
import React from 'react';

import {useScreenSize} from '@/hooks/useScreenSize';
import {drawerWidth} from '@/style/theme/theme.ts';
import {determineOS} from '@/utils';

export type TDrawerProps = React.PropsWithChildren<
  (MuiDrawerProps | SwipeableDrawerProps) & {
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
  }
>;

export const Drawer: React.FC<TDrawerProps> = ({children, closeOnBackdropClick, closeOnEscape, ...props}) => {
  const screenSize = useScreenSize();
  const isIOS = determineOS(navigator.userAgent) === 'iOS';

  const drawerAnchor: 'bottom' | 'right' = React.useMemo(() => {
    return screenSize === 'small' ? 'bottom' : 'right';
  }, [screenSize]);

  const handleClose = React.useCallback(
    (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (
        !props.onClose ||
        (reason === 'backdropClick' && !closeOnBackdropClick) ||
        (reason === 'escapeKeyDown' && !closeOnEscape)
      ) {
        return;
      }

      // event: {} should be fine as this is in their Drawer.d.ts  file
      // onClose?: ModalProps['onClose'];
      // will be onClose?: { bivarianceHack(event: {}, reason: 'backdropClick' | 'escapeKeyDown'): void; }['bivarianceHack'];
      return props.onClose(event as React.SyntheticEvent<{}, Event>, reason);
    },
    [closeOnBackdropClick, closeOnEscape, props],
  );

  if (drawerAnchor === 'bottom') {
    return (
      <SwipeableDrawer
        anchor={drawerAnchor}
        disableBackdropTransition={!isIOS}
        disableDiscovery={isIOS}
        {...props}
        onOpen={() => {}}
        onClose={() => handleClose({}, 'backdropClick')}
        PaperProps={{
          elevation: 0,
          ...props.PaperProps,
          sx: {
            borderTopLeftRadius: theme => `${theme.shape.borderRadius}px`,
            borderTopRightRadius: theme => `${theme.shape.borderRadius}px`,
            ...props.PaperProps?.sx,
          },
        }}
        children={children}
      />
    );
  }
  return (
    <MuiDrawer
      anchor={drawerAnchor}
      {...props}
      onClose={handleClose}
      PaperProps={{
        elevation: 0,
        ...props.PaperProps,
        sx: {
          boxSizing: 'border-box',
          width: drawerWidth * 2,
          ...props.PaperProps?.sx,
        },
      }}
      children={children}
    />
  );
};
