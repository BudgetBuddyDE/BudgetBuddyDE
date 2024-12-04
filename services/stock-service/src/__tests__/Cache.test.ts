import {describe, expect, it, vi} from 'vitest';

import {MetalCache} from '../services/cache';

describe('determineTtlForMetal', () => {
  const cache = new MetalCache();

  it('should return the correct TTL for metal when the current time is 13:59:50', () => {
    const now = new Date();
    now.setHours(13, 59, 50, 0);
    const spy = vi.spyOn(global, 'Date').mockImplementation(() => now);
    expect(cache.determineTtlForMetal()).toBe(36009);
    spy.mockRestore();
  });

  it('should return the correct TTL for metal when the current time is 23:59:50', () => {
    const now = new Date();
    now.setHours(23, 59, 50, 0);
    const spy = vi.spyOn(global, 'Date').mockImplementation(() => now);
    expect(cache.determineTtlForMetal()).toBe(9);
    spy.mockRestore();
  });
});
