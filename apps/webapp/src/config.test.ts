import {Config} from '@budgetbuddyde/core/config/Config';
import {describe, expect, it} from 'vitest';
import packageJson from '../package.json';
import {WebappConfig} from './config';

const {name, version} = packageJson;

describe('WebappConfig', () => {
  it('extends Config and applies browser-safe defaults', () => {
    const config = WebappConfig.fromEnvironment({});

    expect(config).toBeInstanceOf(Config);
    expect(config).toMatchObject({
      service: name,
      version,
      runtime: 'development',
      authServiceHost: 'http://localhost:8080',
      backendServiceHost: 'http://localhost:9000',
      log: {level: 'info'},
    });
  });

  it('normalizes public build-time values', () => {
    const config = WebappConfig.fromEnvironment({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_VERSION: ' 3.6.0 ',
      NEXT_PUBLIC_AUTH_SERVICE_HOST: ' https://auth.budget-buddy.de ',
      NEXT_PUBLIC_BACKEND_SERVICE_HOST: ' https://api.budget-buddy.de ',
      NEXT_PUBLIC_LOG_LEVEL: 'debug',
    });

    expect(config).toMatchObject({
      runtime: 'production',
      version: '3.6.0',
      authServiceHost: 'https://auth.budget-buddy.de',
      backendServiceHost: 'https://api.budget-buddy.de',
      log: {level: 'debug'},
    });
  });

  it('uses local host defaults for blank values and normalizes the runtime', () => {
    const config = WebappConfig.fromEnvironment({
      NODE_ENV: 'preview',
      NEXT_PUBLIC_AUTH_SERVICE_HOST: ' ',
      NEXT_PUBLIC_BACKEND_SERVICE_HOST: '',
      NEXT_PUBLIC_LOG_LEVEL: 'crit',
    });

    expect(config.runtime).toBe('development');
    expect(config.authServiceHost).toBe('http://localhost:8080');
    expect(config.backendServiceHost).toBe('http://localhost:9000');
    expect(config.log.level).toBe('error');
  });

  it('preserves the test runtime and falls back for an invalid log level', () => {
    const config = WebappConfig.fromEnvironment({NODE_ENV: 'test', NEXT_PUBLIC_LOG_LEVEL: 'invalid'});

    expect(config.runtime).toBe('test');
    expect(config.log.level).toBe('info');
  });
});
