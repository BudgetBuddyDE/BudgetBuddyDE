import {
  ApiClientError,
  BackendConfig,
  BackendError,
  CacheError,
  Config,
  CustomError,
  DatabaseError,
  EnvironmentNotSetError,
  EnvironmentVariable,
} from './index';

describe('Config', () => {
  it('stores immutable common service properties', () => {
    const config = new Config({service: 'service', version: '1.0.0', runtime: 'test'});

    expect(config).toMatchObject({service: 'service', version: '1.0.0', runtime: 'test'});
  });

  it('extends the common properties with the backend port', () => {
    const config = new BackendConfig({service: 'backend', version: '1.0.0', runtime: 'test', port: 9000});

    expect(config).toBeInstanceOf(Config);
    expect(config.port).toBe(9000);
  });
});

describe('CustomError', () => {
  it.each([
    [new ApiClientError('API request failed'), ApiClientError],
    [new BackendError(500, 'Internal Server Error'), ApiClientError],
    [new CacheError('Cache request failed'), CacheError],
    [new DatabaseError('Database request failed'), DatabaseError],
    [new EnvironmentNotSetError('DATABASE_URL'), EnvironmentNotSetError],
  ])('preserves the %p inheritance chain', (error, errorClass) => {
    expect(error).toBeInstanceOf(errorClass);
    expect(error).toBeInstanceOf(CustomError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(error.constructor.name);
  });

  it('retains backend response metadata', () => {
    const error = new BackendError(502, 'Bad Gateway');

    expect(error.statusCode).toBe(502);
    expect(error.backendResponseText).toBe('Bad Gateway');
    expect(error.getMessage()).toBe('Backend failed the request with status 502: Bad Gateway');
  });
});

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
