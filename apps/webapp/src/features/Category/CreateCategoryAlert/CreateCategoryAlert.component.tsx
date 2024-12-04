import {Alert, type AlertProps, AlertTitle, type AlertTitleProps} from '@mui/material';
import React from 'react';

export type CreateCategoryAlertProps = AlertProps & {
  alerTitle?: AlertTitleProps;
};

export const CreateCategoryAlert: React.FC<CreateCategoryAlertProps> = props => {
  return (
    <Alert severity="info" {...props}>
      <AlertTitle {...props.alerTitle}>Info</AlertTitle>
      To be able to create a transaction you have to create a category under{' '}
      <strong>Categories {'>'} Add Category</strong> before.{' '}
    </Alert>
  );
};
