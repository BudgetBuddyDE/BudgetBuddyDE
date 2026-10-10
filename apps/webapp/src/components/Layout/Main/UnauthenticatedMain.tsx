'use client';
import {styled} from '@mui/material';

export const UnauthenticatedMain = styled('main')(() => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  isolation: 'isolate',
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
    '@media (max-width: 899.95px)': {
      width: 'min(72vw, 24rem)',
      top: '-7rem',
      right: '-5rem',
    },
  },
  '&::after': {
    width: 'min(40vw, 44rem)',
    bottom: '-19rem',
    left: '5vw',
    '@media (max-width: 899.95px)': {
      width: 'min(82vw, 27rem)',
      bottom: '-12rem',
      left: '-8rem',
    },
  },
}));
