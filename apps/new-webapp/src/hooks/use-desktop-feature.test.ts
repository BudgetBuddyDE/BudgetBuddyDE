import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useDesktopFeature} from './use-desktop-feature';

describe('useDesktopFeature', () => {
  it('tracks the supported desktop media query', () => {
    let listener: (() => void) | undefined;
    const media = {
      matches: false,
      addEventListener: vi.fn((_event, callback) => {
        listener = callback;
      }),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList);
    const {result, unmount} = renderHook(() => useDesktopFeature());
    expect(result.current).toBe(false);
    media.matches = true;
    act(() => listener?.());
    expect(result.current).toBe(true);
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
