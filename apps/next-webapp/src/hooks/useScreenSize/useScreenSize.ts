import { useWindowDimensions } from '../useWindowDimensions';

export type ScreenSize = 'small' | 'medium' | 'large';

export function useScreenSize(): ScreenSize {
  const { breakpoint } = useWindowDimensions();

  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return 'small';
  } else if (breakpoint === 'md' || breakpoint === 'lg') {
    return 'medium';
  } else return 'large';
}
