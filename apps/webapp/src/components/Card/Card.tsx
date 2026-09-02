import {Box, Paper, type PaperProps, Typography} from '@mui/material';
import type React from 'react';
import {forwardRef} from 'react';
import {ActionPaper} from '../ActionPaper';

export type CardProps = React.PropsWithChildren<PaperProps>;
export type CardSectionProps = React.PropsWithChildren<PaperProps>;

const Card = forwardRef<HTMLDivElement, CardProps>(({children, sx, ...props}, ref) => (
  <Paper
    ref={ref}
    elevation={3}
    sx={[{p: 2, borderRadius: 2, boxShadow: 'unset'}, ...(Array.isArray(sx) ? sx : [sx])]}
    {...props}
  >
    {children}
  </Paper>
));
Card.displayName = 'Card';

const Header = forwardRef<HTMLDivElement, CardSectionProps>(({children, sx, ...props}, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={[
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        mb: 1,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Box>
));
Header.displayName = 'CardHeader';

export interface HeaderActionsProps extends CardSectionProps {
  actionPaperProps?: PaperProps;
}
const HeaderActions = forwardRef<HTMLDivElement, HeaderActionsProps>(
  ({children, sx, actionPaperProps, ...props}, ref) => (
    <Box ref={ref} {...props} sx={[{display: 'flex', flexDirection: 'row'}, ...(Array.isArray(sx) ? sx : [sx])]}>
      <ActionPaper {...actionPaperProps}>{children}</ActionPaper>
    </Box>
  ),
);
HeaderActions.displayName = 'CardHeaderActions';

const Title = forwardRef<HTMLSpanElement, CardSectionProps>(({children, sx, ...props}, ref) => (
  <Typography {...props} ref={ref} variant="subtitle1" sx={[{fontWeight: 'bold'}, ...(Array.isArray(sx) ? sx : [sx])]}>
    {children}
  </Typography>
));
Title.displayName = 'CardTitle';

const Subtitle = forwardRef<HTMLSpanElement, CardSectionProps>(({children, sx, ...props}, ref) => (
  <Typography
    {...props}
    ref={ref}
    variant="subtitle2"
    sx={[{color: 'text.secondary'}, ...(Array.isArray(sx) ? sx : [sx])]}
  >
    {children}
  </Typography>
));
Subtitle.displayName = 'CardSubtitle';

const Body = forwardRef<HTMLDivElement, CardSectionProps>(({children, sx, ...props}, ref) => (
  <Box ref={ref} sx={sx} {...props}>
    {children}
  </Box>
));
Body.displayName = 'CardBody';

const Footer = forwardRef<HTMLDivElement, CardSectionProps>(({children, sx, ...props}, ref) => (
  <Box ref={ref} sx={sx} {...props}>
    {children}
  </Box>
));
Footer.displayName = 'CardFooter';

export default Object.assign(Card, {
  Header,
  HeaderActions,
  Title,
  Subtitle,
  Body,
  Footer,
});
