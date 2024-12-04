import {determineOS} from './determineOS.util';

describe('determineOS.util.ts', () => {
  it('should correctly determine the OS as Windows', () => {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';
    const result = determineOS(userAgent);
    expect(result).toBe('Windows');
  });

  it('should correctly determine the OS as Android', () => {
    const userAgent =
      'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36';
    const result = determineOS(userAgent);
    expect(result).toBe('Android');
  });

  it('should correctly determine the OS as iOS', () => {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1';
    const result = determineOS(userAgent);
    expect(result).toBe('iOS');
  });

  it('should correctly determine the OS as MacOS', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36';
    const result = determineOS(userAgent);
    expect(result).toBe('MacOS');
  });

  it('should correctly determine the OS as Linux', () => {
    const userAgent = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:87.0) Gecko/20100101 Firefox/87.0';
    const result = determineOS(userAgent);
    expect(result).toBe('Linux');
  });

  it('should default to unknown if the OS cannot be determined', () => {
    const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const result = determineOS(userAgent);
    expect(result).toBe('unknown');
  });
});
