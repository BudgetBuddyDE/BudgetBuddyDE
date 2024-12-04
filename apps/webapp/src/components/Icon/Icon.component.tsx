import {Box, type BoxProps, alpha, styled} from '@mui/material';
import React from 'react';

export type TColorKeys = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

export const IconBackground = styled(Box)<{
  iconColor?: TColorKeys;
}>(({theme, iconColor}) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: '40px',
  width: '40px',
  height: 'auto',
  aspectRatio: '1/1',
  backgroundColor: alpha(iconColor ? theme.palette[iconColor].main : theme.palette.primary.main, 0.2),
  color: iconColor ? theme.palette[iconColor].main : theme.palette.primary.main,
  borderRadius: `${Number(theme.shape.borderRadius) * 0.75}px`,
}));

export type TIconProps = BoxProps & {
  icon: React.ReactNode | JSX.Element;
  iconColor?: TColorKeys;
};

export const Icon: React.FC<TIconProps> = props => {
  return <IconBackground {...props}>{props.icon}</IconBackground>;
};
