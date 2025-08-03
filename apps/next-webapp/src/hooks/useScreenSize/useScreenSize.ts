import {useWindowDimensions} from '../useWindowDimensions';

export function useScreenSize() {
  const {breakpoint} = useWindowDimensions();

  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return 'small';
  } else if (breakpoint === 'md' || breakpoint === 'lg') {
    return 'medium';
  } else return 'large';
}
