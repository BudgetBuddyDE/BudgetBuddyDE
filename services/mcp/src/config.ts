import {
  BackendConfig,
  type BackendConfigOptions,
  getOptionalEnvironmentValue,
  getPort,
  getRuntime,
} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import 'dotenv/config';
import {name, version} from '../package.json';

function getRequiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = getOptionalEnvironmentValue(environment, name);
  if (value === undefined) throw new EnvironmentNotSetError(name);
  return value;
}

/** Complete, centrally constructed runtime configuration for the MCP service. */
export class AppConfig extends BackendConfig {
  public readonly backendUrl: string;
  public readonly log: {
    level: LogThreshold;
  };
  public readonly rateLimit: {
    enabled: boolean;
    windowMs: number;
    limit: number;
  };

  constructor({
    backendUrl,
    log,
    rateLimit,
    ...backendConfig
  }: BackendConfigOptions & Pick<AppConfig, 'backendUrl' | 'log' | 'rateLimit'>) {
    super(backendConfig);
    this.backendUrl = backendUrl;
    this.log = log;
    this.rateLimit = rateLimit;
  }

  /** Builds the MCP-service configuration from a process environment. */
  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): AppConfig {
    const runtime = getRuntime(environment.NODE_ENV);

    return new AppConfig({
      service: name,
      version,
      port: getPort(environment.PORT, 8070),
      runtime,
      backendUrl: getRequiredEnvironmentValue(environment, 'BUDGETBUDDY_BACKEND_URL'),
      log: {
        level: getLogLevel(environment.LOG_LEVEL),
      },
      rateLimit: {
        enabled: runtime === 'production',
        windowMs: 60_000,
        limit: 120,
      },
    });
  }
}

export const config = AppConfig.fromEnvironment();
