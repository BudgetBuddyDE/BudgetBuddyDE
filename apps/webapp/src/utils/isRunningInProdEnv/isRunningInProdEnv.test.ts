import {isRunningInProdEnv} from './isRunningInProdEnv.util';

describe('isRunningInProdEnv.util.ts', () => {
  it('should return true when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    const result = isRunningInProdEnv();
    expect(result).toBe(true);
  });

  it('should return false when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    const result = isRunningInProdEnv();
    expect(result).toBe(false);
  });

  it('should return false when NODE_ENV is undefined', () => {
    delete process.env.NODE_ENV;
    const result = isRunningInProdEnv();
    expect(result).toBe(false);
  });
});
