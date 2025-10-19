import cds from "@sap/cds";
import assert from "node:assert";

/**
 * BaseService is an extendable class that can be used as a base for all CAP services.
 * It provides central utility methods and standardized hooks.
 * @example
 * ```typescript
 * import { BaseService } from './lib/BaseService';
 *
 * export class MyService extends BaseService {
 *   async init() {
 *     // Custom initialization logic
 *     await super.init(); // Call the base init method
 *   }
 * }
 * ```
 */
export abstract class BaseService extends cds.ApplicationService {
  protected readonly logger = cds.log(this.name, {
    label: this.name /*, level: 'debug'*/,
  });

  get utils() {
    return {
      toDecimal(num: number, fractionDigits: number = 2): number {
        return Number(num.toFixed(fractionDigits));
      },
    };
  }

  /**
   * Initializes the service and sets up global hooks and error handling.
   */
  async init(): Promise<void> {
    this.logger.debug(`${this.name} initializing...`);

    // this.measure('Service Init', async () => {
    //   await new Promise((resolve) => setTimeout(resolve, 100));
    // });

    // Mount global error-handling
    // this.before('*', async (req) => {
    //   this.logger.debug(`Incoming ${req.event} on ${req.path}`);
    // });

    this.on("error", (err, req) => {
      this.logger.error(
        `Error in ${req?.event || "unknown"}: ${err.message || "Unknown error"}`,
      );
    });

    return super.init();
  }

  /**
   * Utility: Assert that a specific request value is set (not null/undefined).
   * @param req - The request object
   * @param key - The key to check
   */
  protected assertRequestValueIsSet<K extends keyof cds.Request>(
    req: cds.Request,
    key: K,
  ): asserts req is cds.Request & { [P in K]: NonNullable<cds.Request[P]> } {
    assert(
      req[key] !== undefined && req[key] !== null,
      `${String(key)} is not set on request`,
    );
  }

  /**
   * Global utility function to measure execution time of functions.
   */
  protected async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    const result = await fn();
    const ms = Date.now() - start;
    this.logger.info(`${label} took ${ms}ms`);
    return result;
  }

  // TODO: Write tests to validate that this works as expected due to the fact, that it is not directly supported by Capire
  protected getReqQuery(req: cds.Request): object {
    // @ts-expect-error
    const query = req.context.http.req.query;
    assert(
      (query !== undefined && query !== null) || typeof query !== "object",
      `Query is not set on request`,
    );
    return query;
  }

  protected async handleError<T>(error: unknown, request: cds.Request<T>) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error(err);
    request.error(500, err.message);
  }
}
