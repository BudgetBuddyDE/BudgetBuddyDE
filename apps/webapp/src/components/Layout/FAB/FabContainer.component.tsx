import {Box, styled} from '@mui/material';

export const FabContainer = styled(Box)(({theme}) => ({
  display: 'flex',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  flexDirection: 'column',
  alignItems: 'flex-end',
  rowGap: '1rem',
  position: 'fixed',
  bottom: '1rem',
  right: '1rem',
}));
