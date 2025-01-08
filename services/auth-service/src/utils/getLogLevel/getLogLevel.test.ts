import {getLogLevel} from './getLogLevel.util';

describe('correct log level is set', () => {
  // Should be at the top in order to succeed because the LOG_LEVEL environment variable gets overwritten in the cases below
  it('should have level "error" for tests', () => {
    const lvl = getLogLevel();
    expect(lvl).toEqual('error');
  });

  it('should have default value', () => {
    delete process.env.LOG_LEVEL;
    const lvl = getLogLevel();
    expect(lvl).toEqual('info');
  });

  it('should accept value from environment variable', () => {
    process.env.LOG_LEVEL = 'debug';
    const lvl = getLogLevel();
    expect(lvl).toEqual('debug');
  });
});
