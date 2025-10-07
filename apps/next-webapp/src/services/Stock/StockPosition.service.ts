import { type ServiceResponse } from '@/types/Service';
import { EntityService } from '../Entity.service';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';
import {
  SearchAsset,
  StockPositionsWithCount,
  type TSearchAsset,
  type TStockPositionsWithCount,
} from '@/types';
import z from 'zod';

export class StockPositionService extends EntityService {
  static {
    this.entity = 'StockPosition';
  }

  static async getWithCount(
    query?: Omit<OdataQuery, '$count' | '$expand'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TStockPositionsWithCount>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$entityPath)
        .query({
          $expand: 'toExchange',
          ...query,
          $count: true,
        });
      this.logger.debug('Fetched stock positions:', records);
      const parsingResult = StockPositionsWithCount.safeParse(records);
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

  /**
   * Search securities via Parqet using keywords
   * @param query Search query
   * @param config
   * @returns
   */
  static async search(
    query: string,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TSearchAsset[]>> {
    try {
      const records = await this.newOdataHandler(config)
        .get(this.$servicePath + '/SearchAsset')
        .query({
          $search: query,
        });
      const parsingResult = z.array(SearchAsset).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
