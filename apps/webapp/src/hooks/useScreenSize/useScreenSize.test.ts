import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vite-plus/test';

import {useScreenSize} from './useScreenSize';

describe('useScreenSize', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {writable: true, configurable: true, value: 1024});
  });

  it('returns "small" for xs width (< 600)', () => {
    Object.defineProperty(window, 'innerWidth', {value: 400, writable: true, configurable: true});
    const {result} = renderHook(() => useScreenSize());
    expect(result.current).toBe('small');
  });

  it('updates to the current viewport size after mounting', () => {
    Object.defineProperty(window, 'innerWidth', {value: 1024, writable: true, configurable: true});
    const {result} = renderHook(() => useScreenSize());
    expect(result.current).toBe('medium');
  });

  it('returns "large" for xl width (>= 1536)', () => {
    Object.defineProperty(window, 'innerWidth', {value: 1920, writable: true, configurable: true});
    const {result} = renderHook(() => useScreenSize());
    expect(result.current).toBe('large');
  });

  it('updates when the viewport is resized', () => {
    const {result} = renderHook(() => useScreenSize());

    act(() => {
      Object.defineProperty(window, 'innerWidth', {value: 1024, writable: true, configurable: true});
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe('medium');
  });
});
