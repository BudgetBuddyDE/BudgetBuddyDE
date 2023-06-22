import { Alert, AlertProps, AlertTitle, AlertTitleProps } from '@mui/material';
import React from 'react';

export interface CreatePaymentMethodInfoProps extends AlertProps {
    alerTitle?: AlertTitleProps;
}

export const CreatePaymentMethodInfo: React.FC<CreatePaymentMethodInfoProps> = (props) => {
    return (
        <Alert severity="info" {...props}>
            <AlertTitle {...props.alerTitle}>Info</AlertTitle>
            To be able to create a transaction you have to create a payment-method under{' '}
            <strong>Payment Methods {'>'} Add Payment Method</strong> before.{' '}
        </Alert>
    );
};
