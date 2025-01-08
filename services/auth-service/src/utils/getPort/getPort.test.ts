import {getPort} from './getPort';

describe('getPort', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {...originalEnv};
  });

  it('should return the port number from the environment variable', () => {
    process.env.PORT = '4000';
    const port = getPort();
    expect(port).toBe(4000);
  });

  it('should return the default port number 8080 if environment variable is not set', () => {
    delete process.env.PORT;
    const port = getPort();
    expect(port).toBe(8080);
  });

  it('should return the default port number 8080 if environment variable is not a number', () => {
    process.env.PORT = 'not-a-number';
    const port = getPort();
    expect(port).toBe(8080);
  });
});
