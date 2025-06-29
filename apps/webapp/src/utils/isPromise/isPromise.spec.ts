import {describe, expect, it} from 'vitest';

import {isPromise} from './isPromise';

describe('isPromise', () => {
  it('should return true for native Promises', () => {
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise(new Promise(() => {}))).toBe(true);
  });

  it('should return false for thenable objects (not real Promises)', () => {
    const thenable = {then: () => {}};
    expect(isPromise(thenable)).toBe(false);
  });

  it('should return false for non-object values', () => {
    expect(isPromise(null)).toBe(false);
    expect(isPromise(undefined)).toBe(false);
    expect(isPromise(42)).toBe(false);
    expect(isPromise('promise')).toBe(false);
    expect(isPromise(true)).toBe(false);
  });

  it('should return false for plain objects', () => {
    expect(isPromise({})).toBe(false);
    expect(isPromise({foo: 'bar'})).toBe(false);
  });
});
