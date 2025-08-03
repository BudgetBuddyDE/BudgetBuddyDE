import { z } from 'zod';
import { PaymentMethod, type TPaymentMethod } from '@/types';
import { EntityService } from './Entity.service';
import { type ServiceResponse } from '@/types/Service';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';

export class PaymentMethodService extends EntityService {
  private static readonly $entityPath = this.$servicePath + '/PaymentMethod';

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
}
