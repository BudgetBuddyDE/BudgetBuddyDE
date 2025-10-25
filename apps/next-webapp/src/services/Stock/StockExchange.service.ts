import { z } from 'zod';
import { type ServiceResponse } from '@budgetbuddyde/types';
import { EntityService } from '../Entity.service';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';
import {
  StockExchangesWithCount,
  StockExchangeVH,
  type TStockExchangeVH,
  type TStockExchangesWithCount,
} from '@/types';

export class StockExchangeService extends EntityService {
  static {
    this.$servicePath = '/odata/v4/asset';
    this.entity = 'StockExchange';
  }

  static async getWithCount(
    query?: Omit<OdataQuery, '$count' | '$expand'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TStockExchangesWithCount>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$entityPath)
        .query({
          ...query,
          $count: true,
        });
      this.logger.debug('Fetched stock exchanges:', records);
      const parsingResult = StockExchangesWithCount.safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async getValueHelps(
    query?: OdataQuery,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TStockExchangeVH[]>> {
    try {
      const records = await this.newOdataHandler(config)
        .get(this.$servicePath + '/StockExchange_VH')
        .query(query);
      const parsingResult = z.array(StockExchangeVH).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async delete(): Promise<ServiceResponse<true>> {
    return [null, new Error('Stock exchanges cannot be deleted.')];
  }
}
