import {isProdEnv} from './isProdEnv';

describe('isProdEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {...originalEnv};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true if NODE_ENV is set to production', () => {
    process.env.NODE_ENV = 'production';
    expect(isProdEnv()).toBe(true);
  });

  it('should return true if PROD is set to true', () => {
    process.env.PROD = 'true';
    expect(isProdEnv()).toBe(true);
  });

  it('should return false if NODE_ENV is not set to production and PROD is not set to true', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROD = 'false';
    expect(isProdEnv()).toBe(false);
  });

  it('should return false if NODE_ENV and PROD are not set', () => {
    delete process.env.NODE_ENV;
    delete process.env.PROD;
    expect(isProdEnv()).toBe(false);
  });
});
