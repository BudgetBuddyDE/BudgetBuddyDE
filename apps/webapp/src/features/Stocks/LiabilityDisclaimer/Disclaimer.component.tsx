import {Alert, type AlertProps} from '@mui/material';
import React from 'react';

export type TDataDisclaimerProps = AlertProps;

export const DataDisclaimer: React.FC<TDataDisclaimerProps> = ({...props}) => {
  return (
    <Alert severity="info" {...props}>
      The prices do not reflect all markets and may be subject to time lags or slight variations. The information is
      provided on an "as is" basis. They are for information purposes only and are not to be used for trading or
      advisory purposes.
    </Alert>
  );
};
