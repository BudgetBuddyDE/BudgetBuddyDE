import {Config, type ConfigOptions} from '@budgetbuddyde/core/config/Config';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import packageJson from '../package.json';
import {parsePublicEnvironment, publicEnv, type PublicEnvironment} from './env';

const {name, version} = packageJson;

/** Browser-safe, build-time configuration for the web application. */
export class WebappConfig extends Config {
  public readonly backendServiceHost: string;
  public readonly log: {
    level: LogThreshold;
  };

  constructor({backendServiceHost, log, ...config}: ConfigOptions & Pick<WebappConfig, 'backendServiceHost' | 'log'>) {
    super(config);
    this.backendServiceHost = backendServiceHost;
    this.log = log;
  }

  /** Builds browser-safe webapp configuration from public build-time environment values. */
  static fromEnvironment(environment: PublicEnvironment = process.env): WebappConfig {
    const env = parsePublicEnvironment(environment);
    return new WebappConfig({
      service: name,
      version: WebappConfig.getOptionalEnvironmentValue(env, 'NEXT_PUBLIC_APP_VERSION') ?? version,
      runtime: WebappConfig.getRuntime(env.NODE_ENV),
      backendServiceHost:
        WebappConfig.getOptionalEnvironmentValue(env, 'NEXT_PUBLIC_BACKEND_SERVICE_HOST') ?? 'http://localhost:9000',
      log: {
        level: getLogLevel(env.NEXT_PUBLIC_LOG_LEVEL),
      },
    });
  }

  private static getOptionalEnvironmentValue(
    environment: Record<string, string | undefined>,
    name: string,
  ): string | undefined {
    const value = environment[name]?.trim();
    return value === '' || value === undefined ? undefined : value;
  }

  private static getRuntime(value: string | undefined): 'production' | 'development' | 'test' {
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
}

// Keep public environment reads explicit so Next.js inlines them into browser bundles at build time.
export const webappConfig = WebappConfig.fromEnvironment(publicEnv);
