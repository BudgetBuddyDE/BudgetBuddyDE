'use client';

import {Alert, Collapse, type AlertProps} from '@mui/material';
import React from 'react';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {CloseIconButton} from '../Button';

export type DismissableAlertProps = Omit<AlertProps, 'action' | 'onClick'>;

export const DismissableAlert: React.FC<DismissableAlertProps> = ({...alertProps}) => {
  const [show, setShow] = React.useState(true);
  const t = useAppTranslations();

  return (
    <Collapse in={show}>
      <Alert
        action={<CloseIconButton size="small" onClick={() => setShow(false)} />}
        {...alertProps}
        children={
          alertProps.children ? alertProps.children : t('common.clickTheCloseIconToSeeTheCollapseTransitionInAction')
        }
      />
    </Collapse>
  );
};
