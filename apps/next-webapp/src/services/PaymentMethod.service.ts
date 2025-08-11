import { z } from 'zod';
import {
  PaymentMethod,
  PaymentMethodsWithCount,
  TPaymentMethodsWithCount,
  type TPaymentMethod,
} from '@/types';
import { EntityService } from './Entity.service';
import { type ServiceResponse } from '@/types/Service';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';

export class PaymentMethodService extends EntityService {
  static {
    this.entity = 'PaymentMethod';
  }

  /**
   * Retrieves the list of payment methods from the database.
   * @returns A promise that resolves to an array of TPaymentMethod objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getPaymentMethods(
    query?: OdataQuery,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TPaymentMethod[]>> {
    try {
      const records = await this.newOdataHandler(config).get(this.$entityPath).query(query);
      const parsingResult = z.array(PaymentMethod).safeParse(records);
      if (!parsingResult.success) {
        return this.handleError(new Error('Failed to parse payment methods'));
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  /**
   * Retrieves the list of payment methods from the database with a count of total payment methods.
   * @param query - The OData query parameters.
   * @param config - The OData configuration options.
   * @returns A promise that resolves to a ServiceResponse containing the payment methods and their count.
   */
  static async getPaymentMethodsWithCount(
    query?: Omit<OdataQuery, '$count'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TPaymentMethodsWithCount>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$entityPath)
        .query({ ...query, $count: true });
      this.logger.debug('Fetched payment methods:', records);
      const parsingResult = PaymentMethodsWithCount.safeParse(records);
      if (!parsingResult.success) {
        return this.handleError(new Error('Failed to parse payment methods'));
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
