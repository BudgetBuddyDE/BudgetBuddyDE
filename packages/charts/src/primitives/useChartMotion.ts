'use client';

import {useMediaQuery} from '@mui/material';

export function useChartMotion(animate = false): boolean {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', {defaultMatches: true});
  return animate && !reducedMotion;
}
