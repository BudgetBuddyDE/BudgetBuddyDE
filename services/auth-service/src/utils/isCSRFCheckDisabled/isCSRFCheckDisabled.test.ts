import {isCSRFCheckDisabled} from './isCSRFCheckDisabled';

describe('isCSRFCheckDisabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {...originalEnv};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true if DISABLE_CSRF_CHECK is set to "true"', () => {
    process.env.DISABLE_CSRF_CHECK = 'true';

    expect(isCSRFCheckDisabled()).toBeTruthy();
  });

  it('should return false if DISABLE_CSRF_CHECK is set to "false"', () => {
    process.env.DISABLE_CSRF_CHECK = 'false';
    expect(isCSRFCheckDisabled()).toBeFalsy();
  });

  it('should return false if DISABLE_CSRF_CHECK is not set', () => {
    delete process.env.DISABLE_CSRF_CHECK;
    expect(isCSRFCheckDisabled()).toBeFalsy();
  });

  it('should return false if DISABLE_CSRF_CHECK is set to any other value', () => {
    process.env.DISABLE_CSRF_CHECK = 'some-random-value';
    expect(isCSRFCheckDisabled()).toBeFalsy();
  });
});
