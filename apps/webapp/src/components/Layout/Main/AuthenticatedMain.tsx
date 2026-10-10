'use client';
import {styled} from '@mui/material';

export const AuthenticatedMain = styled('main')(({theme}) => ({
  position: 'relative',
  isolation: 'isolate',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  '&::before, &::after': {
    content: '""',
    position: 'fixed',
    zIndex: -1,
    display: 'block',
    aspectRatio: '1',
    borderRadius: '50%',
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    pointerEvents: 'none',
  },
  '&::before': {
    width: 'min(34vw, 37rem)',
    top: '-11rem',
    right: '4vw',
    [theme.breakpoints.down('md')]: {
      width: 'min(72vw, 24rem)',
      top: '-7rem',
      right: '-5rem',
    },
  },
  '&::after': {
    width: 'min(40vw, 44rem)',
    bottom: '-19rem',
    left: '5vw',
    [theme.breakpoints.down('md')]: {
      width: 'min(82vw, 27rem)',
      bottom: '-12rem',
      left: '-8rem',
    },
  },
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
  },
}));
