import {
  Box,
  type BoxProps,
  Card as MuiCard,
  CardActions,
  type CardActionsProps,
  CardContent,
  type CardContentProps,
  type CardProps as MuiCardProps,
  type PaperProps,
  Typography,
  type TypographyProps,
} from '@mui/material';
import {forwardRef} from 'react';
import {ActionPaper} from '../ActionPaper';

export type CardProps = MuiCardProps;
export type CardSectionProps = BoxProps;

const Card = forwardRef<HTMLDivElement, CardProps>(({children, sx, ...props}, ref) => (
  <MuiCard
    ref={ref}
    elevation={3}
    sx={[{p: 2, borderRadius: 2, boxShadow: 'unset'}, ...(Array.isArray(sx) ? sx : [sx])]}
    {...props}
  >
    {children}
  </MuiCard>
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

const Title = forwardRef<HTMLSpanElement, TypographyProps>(({children, sx, ...props}, ref) => (
  <Typography {...props} ref={ref} variant="subtitle1" sx={[{fontWeight: 'bold'}, ...(Array.isArray(sx) ? sx : [sx])]}>
    {children}
  </Typography>
));
Title.displayName = 'CardTitle';

const Subtitle = forwardRef<HTMLSpanElement, TypographyProps>(({children, sx, ...props}, ref) => (
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

const Body = forwardRef<HTMLDivElement, CardContentProps>(({children, sx, ...props}, ref) => (
  <CardContent ref={ref} sx={[{p: 0, '&:last-child': {pb: 0}}, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
    {children}
  </CardContent>
));
Body.displayName = 'CardBody';

const Footer = forwardRef<HTMLDivElement, CardActionsProps>(({children, sx, ...props}, ref) => (
  <CardActions ref={ref} disableSpacing sx={[{p: 0}, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
    {children}
  </CardActions>
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
