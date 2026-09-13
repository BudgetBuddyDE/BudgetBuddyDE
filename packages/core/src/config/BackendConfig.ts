import {Config, type ConfigOptions} from './Config';

/** Properties required to construct a {@link BackendConfig}. */
export interface BackendConfigOptions extends ConfigOptions {
  /** TCP port on which the backend accepts HTTP requests. */
  port: number;
}

/**
 * Base configuration for the backend service.
 *
 * Extends {@link Config} with the backend HTTP {@link BackendConfig.port | port}.
 */
export class BackendConfig extends Config {
  public readonly port: number;

  constructor({port, ...config}: BackendConfigOptions) {
    super(config);
    this.port = port;
  }
}

/** Reads an optional environment value, treating blank values as unset. */
export function getOptionalEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = environment[name]?.trim();
  return value === '' || value === undefined ? undefined : value;
}

/** Normalizes the runtime name, defaulting to `development`. */
export function getRuntime(value: string | undefined): 'production' | 'development' | 'test' {
  switch (value?.toLowerCase()) {
    case 'production':
      return 'production';
    case 'test':
      return 'test';
    case 'development':
      return 'development';
    default:
      return 'development';
  }
}

/** Parses a TCP port, falling back when the value is not numeric. */
export function getPort(value: string | undefined, fallbackPort: number): number {
  const port = Number.parseInt(value ?? '', 10);
  return Number.isNaN(port) ? fallbackPort : port;
}

/** Parses the Redis database index, falling back when the value is not numeric. */
export function getRedisDatabase(value: string | undefined, fallbackDatabase: number): number {
  if (value === undefined || value.trim() === '') return fallbackDatabase;

  const database = Number(value);
  return Number.isFinite(database) ? database : fallbackDatabase;
}

/** Splits a comma-separated origin list. */
export function getTrustedOrigins(value: string | undefined): string[] {
  return (
    value
      ?.split(',')
      .map(origin => origin.trim())
      .filter(Boolean) ?? []
  );
}

/** Parses the `trust proxy` setting; production defaults to a single reverse proxy. */
export function getTrustProxy(
  value: string | undefined,
  runtime: 'production' | 'development' | 'test',
): boolean | number | string {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === '') return runtime === 'production' ? 1 : false;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : trimmed;
}
