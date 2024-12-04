import {Alert, type AlertProps, AlertTitle, type AlertTitleProps} from '@mui/material';
import React from 'react';

export type TCreatePaymentMethodAlertProps = AlertProps & {
  alerTitle?: AlertTitleProps;
};

export const CreatePaymentMethodAlert: React.FC<TCreatePaymentMethodAlertProps> = props => {
  return (
    <Alert severity="info" {...props}>
      <AlertTitle {...props.alerTitle}>Info</AlertTitle>
      To be able to create a transaction you have to create a payment-method under{' '}
      <strong>Payment Methods {'>'} Add Payment Method</strong> before.{' '}
    </Alert>
  );
};
