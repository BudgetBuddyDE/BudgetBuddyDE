import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {describe, expect, it} from 'vitest';
import {AppConfig} from '../config';

function createConfig(environment: NodeJS.ProcessEnv = {}): AppConfig {
  return AppConfig.fromEnvironment({BUDGETBUDDY_BACKEND_URL: 'http://localhost:9000', ...environment});
}

describe('AppConfig', () => {
  it('extends BackendConfig and applies MCP defaults', () => {
    const config = createConfig();

    expect(config).toBeInstanceOf(BackendConfig);
    expect(config.runtime).toBe('development');
    expect(config.port).toBe(8070);
    expect(config.log.level).toBe('info');
    expect(config.rateLimit).toEqual({enabled: false, windowMs: 60_000, limit: 120});
  });

  it('normalizes injected runtime values and backend URLs', () => {
    const config = createConfig({
      NODE_ENV: 'production',
      PORT: '8081',
      LOG_LEVEL: 'debug',
      BUDGETBUDDY_BACKEND_URL: ' http://backend:9000 ',
    });

    expect(config).toMatchObject({
      runtime: 'production',
      port: 8081,
      backendUrl: 'http://backend:9000',
      log: {level: 'debug'},
      rateLimit: {enabled: true},
    });
  });

  it('falls back to the default port for invalid values', () => {
    expect(createConfig({PORT: 'not-a-port'}).port).toBe(8070);
  });

  it('rejects missing and blank backend URLs', () => {
    expect(() => AppConfig.fromEnvironment({})).toThrow(EnvironmentNotSetError);
    expect(() => AppConfig.fromEnvironment({BUDGETBUDDY_BACKEND_URL: ' '})).toThrow(EnvironmentNotSetError);
  });
});
