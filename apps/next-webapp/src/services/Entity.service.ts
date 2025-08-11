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
  static entity: string;
  static readonly $servicePath = '/odata/v4/backend';
  static $odata: OHandler;
  static readonly logger = logger.child({ scope: EntityService.name });

  static {
    this.$odata = o(this.$backendHost, this.$odataClientConfig);
  }

  static get $entityPath() {
    return this.$servicePath + '/' + this.entity;
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

  static async delete(
    entityId: string,
    cfg?: { entityName: string }
  ): Promise<ServiceResponse<true>> {
    try {
      const response = await this.newOdataHandler()
        .delete(`${this.$entityPath}(ID=${entityId})`)
        .fetch();
      if (Array.isArray(response)) {
        const results = response.map((res) => res.ok);
        if (results.every((ok) => ok)) {
          return [true, null];
        }
        return this.handleError(new Error('Failed to delete ' + (cfg?.entityName || 'entity')));
      }
      if (!response.ok) {
        return this.handleError(new Error('Failed to delete ' + (cfg?.entityName || 'entity')));
      }
      return [true, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
