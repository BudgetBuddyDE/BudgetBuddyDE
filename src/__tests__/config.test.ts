import {getCurrentRuntimeEnvironment, getPort} from '../utils';

describe('should always choose the correct environment', () => {
  beforeEach(() => {
    delete process.env.ENV;
  });

  it('should have the correct environment when process.env.ENV is set (production)', () => {
    const environment = 'production';
    process.env.ENV = environment;
    expect(getCurrentRuntimeEnvironment()).toBe(environment);
  });

  it('should have the correct environment when process.env.ENV is set (test)', () => {
    const environment = 'test';
    process.env.ENV = environment;
    expect(getCurrentRuntimeEnvironment()).toBe(environment);
  });

  it('should have the correct environment when process.env.ENV is set (development)', () => {
    const environment = 'development';
    process.env.ENV = environment;
    expect(getCurrentRuntimeEnvironment()).toBe(environment);
  });

  it("should have the correct environment when process.env.ENV is'nt set", () => {
    expect(getCurrentRuntimeEnvironment()).toBe('development');
  });
});

describe('should always choose the correct port', () => {
  beforeEach(() => {
    delete process.env.PORT;
  });

  it('should have the correct port value when process.env.PORT is set', () => {
    const port = 1234;
    process.env.PORT = String(port);
    process.env.ENV = 'production';
    expect(getPort()).toBe(port);
  });

  it("should have the correct port value when process.env.PORT is'nt set and in production", () => {
    process.env.ENV = 'production';
    expect(getPort()).toBe(8080);
  });

  it("should have the correct port value when process.env.PORT is'nt set and in test", () => {
    process.env.ENV = 'test';
    expect(getPort()).toBe(8070);
  });

  it("should have the correct port value when process.env.PORT is'nt set and in development", () => {
    process.env.ENV = 'development';
    expect(getPort()).toBe(8070);
  });
});
