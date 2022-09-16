import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type DeviceSize = 'small' | 'medium' | 'wide';

export function getBreakpoint(width: number): Breakpoint {
  if (width >= 1536) {
    return 'xl';
  } else if (width >= 1200) {
    return 'lg';
  } else if (width >= 900) {
    return 'md';
  } else if (width >= 600) {
    return 'sm';
  } else {
    return 'xs';
  }
}

export function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
    breakpoint: getBreakpoint(width),
  };
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}
