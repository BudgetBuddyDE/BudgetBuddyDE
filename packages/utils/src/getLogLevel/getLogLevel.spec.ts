import { getLogLevel } from './getLogLevel';

describe('getLogLevel', () => {
  it('should return the log level from the environment variable', () => {
    process.env.LOG_LEVEL = 'debug';
    expect(getLogLevel()).toBe('debug');
  });

  it("should default to 'error' if the environment variable is not set", () => {
    delete process.env.LOG_LEVEL;
    expect(getLogLevel()).toBe('error');
  });

  it("should default to 'error' if the environment variable is invalid", () => {
    process.env.LOG_LEVEL = 'foo';
    expect(getLogLevel()).toBe('error');
  });
});
