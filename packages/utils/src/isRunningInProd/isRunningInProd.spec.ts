import { isRunningInProd } from './isRunningInProd';

describe('getCurrentRuntime', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return "false" when NODE_ENV is not set', () => {
    process.env.NODE_ENV = undefined;
    expect(isRunningInProd()).toBeFalsy();
  });

  it('should return "true" when NODE_ENV is set to "production"', () => {
    process.env.NODE_ENV = 'production';
    expect(isRunningInProd()).toBeTruthy();
  });

  it('should return "false" when NODE_ENV is set to "development"', () => {
    process.env.NODE_ENV = 'development';
    expect(isRunningInProd()).toBeFalsy();
  });

  it('should return "false" when NODE_ENV is set to "test"', () => {
    process.env.NODE_ENV = 'test';
    expect(isRunningInProd()).toBeFalsy();
  });

  it('should return "false" when NODE_ENV is set to an unknown value', () => {
    process.env.NODE_ENV = 'unknown';
    expect(isRunningInProd()).toBeFalsy();
  });
});
