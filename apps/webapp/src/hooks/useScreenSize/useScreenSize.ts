'use client';

import React from 'react';

export type ScreenSize = 'small' | 'medium' | 'large';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

function getBreakpoint(width: number): Breakpoint {
  if (width >= 1536) return 'xl';
  if (width >= 1200) return 'lg';
  if (width >= 900) return 'md';
  if (width >= 600) return 'sm';
  return 'xs';
}

function getScreenSize(): ScreenSize {
  const breakpoint = getBreakpoint(typeof window === 'undefined' ? 0 : window.innerWidth);
  if (breakpoint === 'xs' || breakpoint === 'sm') return 'small';
  if (breakpoint === 'md' || breakpoint === 'lg') return 'medium';
  return 'large';
}

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = React.useState(getScreenSize);

  React.useEffect(() => {
    const handleResize = () => setScreenSize(getScreenSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}
