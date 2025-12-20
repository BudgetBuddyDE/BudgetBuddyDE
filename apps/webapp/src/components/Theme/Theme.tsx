'use client';

import {type Theme as MuiTheme, useTheme} from '@mui/material';
import type React from 'react';

export type ThemeProps = {
  attribute?: keyof MuiTheme;
};

export const Theme: React.FC<ThemeProps> = ({attribute}) => {
  const theme = useTheme();
  return <pre>{JSON.stringify(attribute ? theme[attribute] : theme, null, 4)}</pre>;
};
