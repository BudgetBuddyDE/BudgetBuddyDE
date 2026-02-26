import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';

import {getBreakpoint, getWindowDimensions, useWindowDimensions} from './useWindowDimensions';

describe('getBreakpoint', () => {
  it('returns "xs" for widths below 600', () => {
    expect(getBreakpoint(0)).toBe('xs');
    expect(getBreakpoint(599)).toBe('xs');
  });

  it('returns "sm" for widths 600–899', () => {
    expect(getBreakpoint(600)).toBe('sm');
    expect(getBreakpoint(899)).toBe('sm');
  });

  it('returns "md" for widths 900–1199', () => {
    expect(getBreakpoint(900)).toBe('md');
    expect(getBreakpoint(1199)).toBe('md');
  });

  it('returns "lg" for widths 1200–1535', () => {
    expect(getBreakpoint(1200)).toBe('lg');
    expect(getBreakpoint(1535)).toBe('lg');
  });

  it('returns "xl" for widths 1536 and above', () => {
    expect(getBreakpoint(1536)).toBe('xl');
    expect(getBreakpoint(2560)).toBe('xl');
  });
});

describe('getWindowDimensions', () => {
  it('returns non-negative width and height', () => {
    const {width, height} = getWindowDimensions();
    expect(width).toBeGreaterThanOrEqual(0);
    expect(height).toBeGreaterThanOrEqual(0);
  });

  it('includes a valid breakpoint value', () => {
    const {breakpoint} = getWindowDimensions();
    expect(['xs', 'sm', 'md', 'lg', 'xl']).toContain(breakpoint);
  });
});

describe('useWindowDimensions', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {value: 1024, writable: true, configurable: true});
    Object.defineProperty(window, 'innerHeight', {value: 768, writable: true, configurable: true});
  });

  it('returns initial dimensions matching window', () => {
    const {result} = renderHook(() => useWindowDimensions());
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.breakpoint).toBe('md');
  });

  it('updates dimensions on window resize', () => {
    const {result} = renderHook(() => useWindowDimensions());
    act(() => {
      Object.defineProperty(window, 'innerWidth', {value: 400, writable: true, configurable: true});
      Object.defineProperty(window, 'innerHeight', {value: 600, writable: true, configurable: true});
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.width).toBe(400);
    expect(result.current.breakpoint).toBe('xs');
  });
});
