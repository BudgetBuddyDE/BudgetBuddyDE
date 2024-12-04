import {Box, type BoxProps, Typography, useTheme} from '@mui/material';
import React from 'react';

import {Icon} from '../Icon/Icon.component';

export type TNoResultsProps = {
  text?: string | React.ReactNode;
  icon?: JSX.Element;
} & Pick<BoxProps, 'sx'>;

export const NoResults: React.FC<TNoResultsProps> = ({sx, icon, text = 'No items found'}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 1.5,
        backgroundColor: theme.palette.action.disabledBackground,
        borderRadius: `${theme.shape.borderRadius}px`,
        ...sx,
      }}>
      {typeof text === 'string' ? (
        <Typography textAlign="center">
          {icon && <Icon icon={icon} sx={{mx: 'auto', mb: 1}} />}
          {text}
        </Typography>
      ) : (
        text
      )}
    </Box>
  );
};
