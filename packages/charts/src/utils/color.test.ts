import {describe, expect, it} from 'vite-plus/test';
import {mixHex} from './color';

describe('mixHex', () => {
  it('returns the from color at ratio 0', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('rgb(0, 0, 0)');
  });

  it('returns the to color at ratio 1', () => {
    expect(mixHex('#000000', '#ffffff', 1)).toBe('rgb(255, 255, 255)');
  });

  it('clamps the ratio outside of 0..1', () => {
    expect(mixHex('#000000', '#ffffff', 5)).toBe('rgb(255, 255, 255)');
    expect(mixHex('#000000', '#ffffff', -1)).toBe('rgb(0, 0, 0)');
  });

  it('mixes two colors in the middle', () => {
    expect(mixHex('#ff0000', '#0000ff', 0.5)).toBe('rgb(128, 0, 128)');
  });

  it('supports shorthand hex values', () => {
    expect(mixHex('#fff', '#000', 0.5)).toBe('rgb(128, 128, 128)');
  });
});
