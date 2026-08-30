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
