import {alpha, useTheme} from '@mui/material';
import React from 'react';

export type StyledAutocompleteOptionProps = React.HTMLAttributes<HTMLLIElement> &
  React.PropsWithChildren<{
    selected?: boolean;
  }>;

export const StyledAutocompleteOption: React.FC<StyledAutocompleteOptionProps> = ({
  selected = false,
  children,
  ...elementProps
}) => {
  const theme = useTheme();
  return (
    <li
      {...elementProps}
      style={{
        borderRadius: `${theme.shape.borderRadius}px`,
        marginLeft: theme.spacing(0.5),
        marginRight: theme.spacing(0.5),
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.2) : undefined,
        ...elementProps.style,
      }}>
      {children}
    </li>
  );
};
