import {Paper, type PaperProps} from '@mui/material';
import React from 'react';

export type TActionPaperProps = React.PropsWithChildren<PaperProps>;

export const ActionPaper: React.FC<TActionPaperProps> = props => (
  <Paper
    elevation={2}
    {...props}
    sx={{
      boxShadow: 'none',
      border: 'none',
      ...props.sx,
    }}>
    {props.children}
  </Paper>
);
