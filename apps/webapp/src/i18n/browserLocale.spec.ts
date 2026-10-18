// @vitest-environment node
import {describe, expect, it} from 'vitest';
import {resolveBrowserLocale} from './browserLocale';
import {DEFAULT_LOCALE} from './config';

describe('resolveBrowserLocale', () => {
  it.each([undefined, null, '', ' ', 'fr-FR', 'fr, es;q=0.8'])(
    'defaults for missing or unsupported input %s',
    header => {
      expect(resolveBrowserLocale(header)).toBe(DEFAULT_LOCALE);
    },
  );

  it.each([
    ['de-DE', 'de-DE'],
    ['de', 'de-DE'],
    ['de-AT', 'de-DE'],
    ['de-CH', 'de-DE'],
    ['de-Latn-AT', 'de-DE'],
    ['en-US', 'en-US'],
    ['en', 'en-US'],
    ['en-GB', 'en-US'],
    ['DE-de', 'de-DE'],
    ['\tde-CH ; Q = 0.8\t', 'de-DE'],
  ])('matches exact and language fallback ranges: %s', (header, expected) => {
    expect(resolveBrowserLocale(header)).toBe(expected);
  });

  it.each([
    ['en-US;q=0.2, de-DE;q=0.9', 'de-DE'],
    ['de-DE;q=0.2, en-US;q=0.9', 'en-US'],
    ['fr, de;q=0.8', 'de-DE'],
    ['fr, de;q=.8', 'de-DE'],
    ['en;q=0.8, de', 'de-DE'],
    ['de;q=0.8, en;q=0.8', 'de-DE'],
    ['en;q=0.8, de;q=0.8', 'en-US'],
    ['de-AT;q=0.9, en-US;q=0.8', 'de-DE'],
    ['fr;q=1, de;q=0.001', 'de-DE'],
    ['de;q=1.000, en;q=0.999', 'de-DE'],
  ])('ranks supported preferences by quality and stable order: %s', (header, expected) => {
    expect(resolveBrowserLocale(header)).toBe(expected);
  });

  it.each([
    ['de;q=0, en;q=0.5', 'en-US'],
    ['de-DE;q=0, de;q=1, en;q=0.5', 'en-US'],
    ['DE-de;q=0, de-AT, en;q=0.5', 'en-US'],
    ['de-DE;q=0, de-Latn-AT, en;q=0.5', 'en-US'],
    ['de;q=0, de-DE;q=1', 'de-DE'],
    ['*;q=0, de-DE', 'de-DE'],
    ['*;q=0, de-AT', 'de-DE'],
    ['en;q=0, de;q=0', DEFAULT_LOCALE],
    ['de-DE;q=0, de-DE;q=1', DEFAULT_LOCALE],
    ['de-DE;q=0.000, de;q=1', DEFAULT_LOCALE],
    ['de-AT;q=0, de-DE;q=1', 'de-DE'],
  ])('respects zero-quality exclusions and deterministic ultimate fallback: %s', (header, expected) => {
    expect(resolveBrowserLocale(header)).toBe(expected);
  });

  it.each([
    ['*', DEFAULT_LOCALE],
    ['en-US;q=0, *', 'de-DE'],
    ['en;q=0, *;q=0.8', 'de-DE'],
    ['de;q=0, *', 'en-US'],
    ['*;q=0', DEFAULT_LOCALE],
    ['en;q=0, de;q=0, *', DEFAULT_LOCALE],
    ['*;q=0.5, de;q=0.9', 'de-DE'],
    ['*;q=0.9, de;q=0.5', DEFAULT_LOCALE],
  ])('chooses an allowed default for wildcards: %s', (header, expected) => {
    expect(resolveBrowserLocale(header)).toBe(expected);
  });

  it.each([
    'de;q=2',
    'de;q=-1',
    'de;q=NaN',
    'de;q=Infinity',
    'de;q=',
    'de;q=0.1234',
    'de;q=1.001',
    'de;q=0x1',
    'de;q=1e0',
    'de;q=01',
    'de;q=0.8junk',
    'de;q="0.8"',
    'de;q=0.8;q=1',
    'de;foo=bar',
    'de_DE',
    'de--DE',
    'de-*',
    '<script>de</script>',
    'de\r\nX-Language: de',
    'de\n',
    'de\u0000',
  ])('ignores malformed entries without losing subsequent valid preferences: %s', entry => {
    expect(resolveBrowserLocale(`${entry}, en;q=0.1`)).toBe('en-US');
    expect(resolveBrowserLocale(`${entry}, de-CH;q=0.1`)).toBe('de-DE');
  });

  it('ignores empty entries and malformed exclusions', () => {
    expect(resolveBrowserLocale(',, en-US;q=invalid, de-DE;q=invalid, de;q=0.9,')).toBe('de-DE');
  });

  it('bounds parsing of oversized untrusted headers', () => {
    expect(resolveBrowserLocale(`de,${' '.repeat(8192)}`)).toBe(DEFAULT_LOCALE);
  });
});
