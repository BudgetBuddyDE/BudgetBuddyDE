import {EnvironmentVariable} from './EnvironmentVariable';
import {EnvironmentNotSetError} from '../error/EnvironmentNotSetError';

describe('EnvironmentVariable', () => {
  const variableName = 'BUDGETBUDDY_CORE_TEST_VALUE';
  const originalValue = process.env[variableName];

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env[variableName];
    } else {
      process.env[variableName] = originalValue;
    }
  });

  it('returns a configured environment value unchanged', () => {
    process.env[variableName] = '';

    expect(new EnvironmentVariable(variableName).get()).toBe('');
  });

  it('throws when the environment value is undefined', () => {
    delete process.env[variableName];

    expect(() => new EnvironmentVariable(variableName).get()).toThrow(new EnvironmentNotSetError(variableName));
  });
});
