import {Config} from '@budgetbuddyde/core/config/Config';

/** Browser-safe, build-time configuration for the web application. */
class WebappConfig extends Config {
  public readonly authServiceHost: string;
  public readonly backendServiceHost: string;

  constructor({
    authServiceHost,
    backendServiceHost,
    ...config
  }: ConstructorParameters<typeof Config>[0] & {
    authServiceHost: string;
    backendServiceHost: string;
  }) {
    super(config);
    this.authServiceHost = authServiceHost;
    this.backendServiceHost = backendServiceHost;
  }
}

export const webappConfig = new WebappConfig({
  service: 'webapp',
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',
  runtime: process.env.NODE_ENV ?? 'development',
  authServiceHost: process.env.NEXT_PUBLIC_AUTH_SERVICE_HOST ?? 'http://localhost:8080',
  backendServiceHost: process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST ?? 'http://localhost:9000',
});
