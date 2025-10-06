'use client';

import { Box, type BoxProps, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Icon } from '@/components/Icon';

export type NoResultsProps = {
  text?: string | React.ReactNode;
  icon?: React.ReactNode;
} & Pick<BoxProps, 'sx'>;

export const NoResults: React.FC<NoResultsProps> = ({ sx, icon, text = 'No items found' }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 1.5,
        backgroundColor: theme.palette.action.disabledBackground,
        borderRadius: `${theme.shape.borderRadius}px`,
        ...sx,
      }}
    >
      {typeof text === 'string' ? (
        <React.Fragment>
          {icon && <Icon icon={icon} sx={{ mx: 'auto', mb: 1 }} />}
          <Typography textAlign="center">{text}</Typography>
        </React.Fragment>
      ) : (
        text
      )}
    </Box>
  );
};
