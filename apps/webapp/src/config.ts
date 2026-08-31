import {Config, type ConfigOptions} from '@budgetbuddyde/core/config/Config';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import packageJson from '../package.json';

const {name, version} = packageJson;

/** Browser-safe, build-time configuration for the web application. */
export class WebappConfig extends Config {
  public readonly authServiceHost: string;
  public readonly backendServiceHost: string;
  public readonly log: {
    level: LogThreshold;
  };

  constructor({
    authServiceHost,
    backendServiceHost,
    log,
    ...config
  }: ConfigOptions & Pick<WebappConfig, 'authServiceHost' | 'backendServiceHost' | 'log'>) {
    super(config);
    this.authServiceHost = authServiceHost;
    this.backendServiceHost = backendServiceHost;
    this.log = log;
  }

  /** Builds browser-safe webapp configuration from public build-time environment values. */
  static fromEnvironment(environment: Record<string, string | undefined> = process.env): WebappConfig {
    return new WebappConfig({
      service: name,
      version: WebappConfig.getOptionalEnvironmentValue(environment, 'NEXT_PUBLIC_APP_VERSION') ?? version,
      runtime: WebappConfig.getRuntime(environment.NODE_ENV),
      authServiceHost:
        WebappConfig.getOptionalEnvironmentValue(environment, 'NEXT_PUBLIC_AUTH_SERVICE_HOST') ??
        'http://localhost:8080',
      backendServiceHost:
        WebappConfig.getOptionalEnvironmentValue(environment, 'NEXT_PUBLIC_BACKEND_SERVICE_HOST') ??
        'http://localhost:9000',
      log: {
        level: getLogLevel(environment.NEXT_PUBLIC_LOG_LEVEL),
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
export const webappConfig = WebappConfig.fromEnvironment({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_AUTH_SERVICE_HOST: process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST,
  NEXT_PUBLIC_BACKEND_SERVICE_HOST: process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST,
  NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
});
