import { logger } from '@/logger';
import { ServiceResponse } from '@/types/Service';
import { type OHandler, type OdataConfig, o } from '@tklein1801/o.js';
import { z } from 'zod';

export class EntityService {
  private static readonly $backendHost = 'http://localhost:4004';
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
  static newOdataHandler(config?: Partial<OdataConfig>): OHandler {
    return o(this.$backendHost, { ...this.$odataClientConfig, ...config });
  }

  static handleZodError<T, S>(errors: z.ZodError<S>[]): ServiceResponse<T> {
    const msg = errors.map((e) => e.message).join(', ');
    logger.error('ZodError in TransactionService: %s', msg);
    return [null, new Error(msg)];
  }

  static handleError<T>(e: unknown): ServiceResponse<T> {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error('Error in TransactionService: %s', msg);
    if (e instanceof Response) {
      return [null, new Error(e.statusText)];
    }
    return [null, e instanceof Error ? e : new Error(msg)];
  }
}
