import {isRunningInProdEnv} from './isRunningInProdEnv.util';

describe('isRunningInProdEnv.util.ts', () => {
  test.skip('it should return true when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    const result = isRunningInProdEnv();
    expect(result).toBe(true);
  });

  test('it should return false when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    const result = isRunningInProdEnv();
    expect(result).toBe(false);
  });

  test('it should return false when NODE_ENV is undefined', () => {
    delete process.env.NODE_ENV;
    const result = isRunningInProdEnv();
    expect(result).toBe(false);
  });
});
