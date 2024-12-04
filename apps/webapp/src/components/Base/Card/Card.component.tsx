import {Box, Paper, type PaperProps, Typography} from '@mui/material';
import React from 'react';

import {ActionPaper} from '../ActionPaper';

export type TCardProps = React.PropsWithChildren<PaperProps>;

export type TCardSectionProps = React.PropsWithChildren<PaperProps>;

const Card: React.FC<TCardProps> = ({children, sx, ...props}) => {
  return (
    <Paper {...props} sx={{p: 2, ...sx}}>
      {children}
    </Paper>
  );
};

const Header: React.FC<TCardSectionProps> = ({children, sx, ...props}) => {
  return (
    <Box {...props} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={sx}>
      {children}
    </Box>
  );
};

const HeaderActions: React.FC<TCardSectionProps & {actionPaperProps?: PaperProps}> = ({
  children,
  sx,
  actionPaperProps,
}) => {
  return (
    <Box display="flex" flexDirection="row" sx={sx}>
      <ActionPaper {...actionPaperProps}>{children}</ActionPaper>
    </Box>
  );
};

const Title: React.FC<TCardSectionProps> = ({children, sx}) => {
  return (
    <Typography variant="subtitle1" fontWeight="bold" sx={sx}>
      {children}
    </Typography>
  );
};

const Subtitle: React.FC<TCardSectionProps> = ({children, sx}) => {
  return (
    <Typography variant="subtitle2" sx={sx}>
      {children}
    </Typography>
  );
};

const Body: React.FC<TCardSectionProps> = ({children, sx, ...props}) => {
  return (
    <Box {...props} sx={sx}>
      {children}
    </Box>
  );
};

const Footer: React.FC<TCardSectionProps> = ({children, sx, ...props}) => {
  return (
    <Box {...props} sx={sx}>
      {children}
    </Box>
  );
};

export default Object.assign(Card, {
  Header: Header,
  HeaderActions: HeaderActions,
  Title: Title,
  Subtitle: Subtitle,
  Body: Body,
  Footer: Footer,
});
