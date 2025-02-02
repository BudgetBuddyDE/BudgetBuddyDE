import {Alert, AlertProps, AlertTitle} from '@mui/material';
import React from 'react';

/**
 * Props for the {@link Error} component.
 *
 * Extends the standard {@link AlertProps} from Material-UI, and adds an optional {@link error} property.
 */
export type TErrorProps = {
  /**
   * The error to display.
   */
  error?: Error | null;
} & AlertProps;

/**
 * A component that displays an error message in an {@link Alert} component.
 *
 * The error message includes the error name as the alert title and the error message as the alert description.
 * The alert can be closed by clicking the close button, which will hide the component.
 */
export const Error: React.FC<TErrorProps> = ({error, ...alertProps}) => {
  const [show, setShow] = React.useState(true);
  if (!show || !error) return null;
  return (
    <Alert variant="standard" severity="error" onClose={() => setShow(false)} {...alertProps}>
      <AlertTitle>{error.name}</AlertTitle>
      {error.message}
    </Alert>
  );
};
