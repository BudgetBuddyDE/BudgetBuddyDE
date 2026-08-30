import {Config} from '@budgetbuddyde/core/config/Config';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';

/** Browser-safe, build-time configuration for the web application. */
class WebappConfig extends Config {
  public readonly authServiceHost: string;
  public readonly backendServiceHost: string;
  public readonly logLevel: LogThreshold;

  constructor({
    authServiceHost,
    backendServiceHost,
    logLevel,
    ...config
  }: ConstructorParameters<typeof Config>[0] & {
    authServiceHost: string;
    backendServiceHost: string;
    logLevel: LogThreshold;
  }) {
    super(config);
    this.authServiceHost = authServiceHost;
    this.backendServiceHost = backendServiceHost;
    this.logLevel = logLevel;
  }
}

export const webappConfig = new WebappConfig({
  service: 'webapp',
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',
  runtime: process.env.NODE_ENV ?? 'development',
  authServiceHost: process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST ?? 'http://localhost:8080',
  backendServiceHost: process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST ?? 'http://localhost:9000',
  logLevel: getLogLevel(process.env.NEXT_PUBLIC_LOG_LEVEL),
});
