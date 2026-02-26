import {describe, expect, it} from 'vitest';

import {determineOS, isRunningOnIOs} from './determineOS';

describe('determineOS', () => {
  it('detects Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    expect(determineOS(ua)).toBe('Windows');
  });

  it('detects Android', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36';
    expect(determineOS(ua)).toBe('Android');
  });

  it('detects iOS (iPhone)', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X)';
    expect(determineOS(ua)).toBe('iOS');
  });

  it('detects MacOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    expect(determineOS(ua)).toBe('MacOS');
  });

  it('detects Linux', () => {
    const ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:87.0) Gecko/20100101';
    expect(determineOS(ua)).toBe('Linux');
  });

  it('returns "unknown" for unrecognised user agents', () => {
    const ua = 'CustomBot/1.0';
    expect(determineOS(ua)).toBe('unknown');
  });
});

describe('isRunningOnIOs', () => {
  it('returns true for iPhone user agents', () => {
    expect(isRunningOnIOs('Mozilla/5.0 (iPhone; CPU iPhone OS 14_3)')).toBe(true);
  });

  it('returns true for iPad user agents', () => {
    expect(isRunningOnIOs('Mozilla/5.0 (iPad; CPU OS 14_0)')).toBe(true);
  });

  it('returns false for non-iOS user agents', () => {
    expect(isRunningOnIOs('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false);
  });
});
