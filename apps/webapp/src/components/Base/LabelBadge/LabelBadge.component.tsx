import {type BoxProps} from '@mui/material';
import React from 'react';

import {IconBackground, type TColorKeys} from '@/components/Icon';

export type TLabelBadgeProps = {
  color?: TColorKeys;
  children: string | React.ReactNode;
  boxProps?: Omit<BoxProps, 'color'>;
};

export const LabelBadge: React.FC<TLabelBadgeProps> = ({color = 'primary', children, boxProps}) => {
  return (
    <IconBackground
      iconColor={color}
      {...boxProps}
      sx={{
        width: 'fit-content',
        aspectRatio: 'unset',
        px: 1,
        py: 0.25,
        ...boxProps?.sx,
      }}>
      {children}
    </IconBackground>
  );
};
