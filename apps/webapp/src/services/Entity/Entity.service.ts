import {type OHandler, type OdataConfig, o} from '@tklein1801/o.js';

export class EntityService {
  private static readonly $backendHost = import.meta.env.VITE_BACKEND_HOST;
  private static readonly $odataClientConfig: Partial<OdataConfig> = {
    // TODO: Configure the $batch endpoint
    credentials: 'include',
  };
  static readonly $servicePath = '/odata/v4/backend';
  static $odata: OHandler;

  static {
    this.$odata = o(this.$backendHost, this.$odataClientConfig);
  }

  /**
   * Returns a new OData handler with the configured backend host and client settings.
   * @returns A new OData handler instance.
   */
  static newOdataHandler(): OHandler {
    return o(this.$backendHost, this.$odataClientConfig);
  }
}
