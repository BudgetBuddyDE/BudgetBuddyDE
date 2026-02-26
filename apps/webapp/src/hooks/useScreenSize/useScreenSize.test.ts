import {renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';

import {useScreenSize} from './useScreenSize';

describe('useScreenSize', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {writable: true, configurable: true, value: 1024});
  });

  it('returns "small" for xs width (< 600)', () => {
    Object.defineProperty(window, 'innerWidth', {value: 400, writable: true, configurable: true});
    window.dispatchEvent(new Event('resize'));
    const {result} = renderHook(() => useScreenSize());
    expect(result.current).toBe('small');
  });

  it('returns "medium" for md width (900–1199)', () => {
    Object.defineProperty(window, 'innerWidth', {value: 1024, writable: true, configurable: true});
    window.dispatchEvent(new Event('resize'));
    const {result} = renderHook(() => useScreenSize());
    expect(result.current).toBe('medium');
  });

  it('returns "large" for xl width (>= 1536)', () => {
    Object.defineProperty(window, 'innerWidth', {value: 1920, writable: true, configurable: true});
    window.dispatchEvent(new Event('resize'));
    const {result} = renderHook(() => useScreenSize());
    expect(result.current).toBe('large');
  });
});
