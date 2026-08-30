/** Common properties shared by service configurations. */
export interface ConfigOptions {
  /** Name of the configured service. */
  service: string;
  /** Version of the configured service. */
  version: string;
  /** Runtime in which the service executes, for example `development`. */
  runtime: string;
}

/**
 * Immutable base configuration for a BudgetBuddy service.
 *
 * Extend this class for service-specific configuration such as {@link BackendConfig}.
 */
export class Config {
  public readonly service: string;
  public readonly version: string;
  public readonly runtime: string;

  constructor({service, version, runtime}: ConfigOptions) {
    this.service = service;
    this.version = version;
    this.runtime = runtime;
  }
}

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
