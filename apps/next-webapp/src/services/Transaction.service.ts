import { z } from 'zod';
import {
  ExpandedTransasction,
  MonthlyKPIResponse,
  type TExpandedTransaction,
  type TMonthlyKPIResponse,
} from '@/types';
import { EntityService } from './Entity.service';
import { type ServiceResponse } from '@/types/Service';
import { OdataConfig, OdataQuery } from '@tklein1801/o.js';

export class TransactionService extends EntityService {
  private static readonly $entityPath = this.$servicePath + '/Transaction';

  /**
   * Retrieves the list of transactions from the database.
   * @returns A promise that resolves to an array of TTransaction objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getTransactions(
    query?: OdataQuery,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TExpandedTransaction[]>> {
    try {
      const records = await this.newOdataHandler(config)
        .get(this.$entityPath)
        .query({
          $expand: 'toCategory,toPaymentMethod',
          ...query,
        });
      const parsingResult = z.array(ExpandedTransasction).safeParse(records);
      if (!parsingResult.success) {
        return this.handleError(new Error('Failed to parse transactions'));
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  /**
   * Retrieves the monthly KPIs from the database.
   * @returns A promise that resolves to a TMonthlyKPIResponse object containing the monthly KPIs.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getMonthlyKPIs(
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TMonthlyKPIResponse>> {
    try {
      const records = await this.newOdataHandler(config)
        .get(this.$servicePath + '/MonthlyKPI')
        .query();
      const parsingResult = MonthlyKPIResponse.safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError([parsingResult.error]);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
