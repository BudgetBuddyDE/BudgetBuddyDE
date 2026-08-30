'use client';

import {Alert, Collapse, type AlertProps} from '@mui/material';
import React from 'react';
import {CloseIconButton} from '../Button';

export type DismissableAlertProps = Omit<AlertProps, 'action' | 'onClick'>;

export const DismissableAlert: React.FC<DismissableAlertProps> = ({...alertProps}) => {
  const [show, setShow] = React.useState(true);

  return (
    <Collapse in={show}>
      <Alert
        action={<CloseIconButton size="small" onClick={() => setShow(false)} />}
        {...alertProps}
        children={
          alertProps.children ? alertProps.children : 'Click the close icon to see the Collapse transition in action!'
        }
      />
    </Collapse>
  );
};
