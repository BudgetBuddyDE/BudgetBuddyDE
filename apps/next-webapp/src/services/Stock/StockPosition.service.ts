import { type ServiceResponse } from '@/types/Service';
import { EntityService } from '../Entity.service';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';
import {
  SearchAsset,
  StockPosition,
  StockPositionsWithCount,
  type TStockPosition,
  type TCreateOrUpdateStockPosition,
  type TSearchAsset,
  type TStockPositionsWithCount,
  type TStockPositionsKPI,
  StockPositionsKPI,
  TStockPositionAllocation,
  StockPositionAllocation,
} from '@/types';
import z from 'zod';

export class StockPositionService extends EntityService {
  private static $defaultQuery: OdataQuery = {
    $expand: 'toExchange',
  };

  static {
    this.$servicePath = '/odata/v4/asset';
    this.entity = 'StockPosition';
  }

  static async create(payload: TCreateOrUpdateStockPosition): Promise<ServiceResponse<unknown>> {
    try {
      const record = await this.newOdataHandler().post(this.$entityPath, payload).query();
      const parsingResult = StockPosition.omit({
        logoUrl: true,
        securityName: true,
        assetType: true,
        currentPrice: true,
        positionValue: true,
        absoluteProfit: true,
        relativeProfit: true,
      }).safeParse(record);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async update(
    entityId: string,
    payload: TCreateOrUpdateStockPosition
  ): Promise<ServiceResponse<TStockPosition>> {
    try {
      const record = await this.newOdataHandler()
        .patch(`${this.$entityPath}(ID=${entityId})`, payload)
        .query();
      const parsingResult = StockPosition.safeParse(record);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async getWithCount(
    query?: Omit<OdataQuery, '$count' | '$expand'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TStockPositionsWithCount>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$entityPath)
        .query({
          ...this.$defaultQuery,
          ...query,
          $count: true,
        });
      const parsingResult = StockPositionsWithCount.safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
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
        .query({ $search: query });
      const parsingResult = z.array(SearchAsset).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async getKPIs(
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TStockPositionsKPI>> {
    try {
      const records = await this.newOdataHandler(config)
        .get(this.$servicePath + '/StockPositionsKPI')
        .query();
      const parsingResult = StockPositionsKPI.safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async getPositionAllocations(
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TStockPositionAllocation[]>> {
    try {
      const records = await this.newOdataHandler(config)
        .get(this.$servicePath + '/StockPositionAllocation')
        .query();
      const parsingResult = z.array(StockPositionAllocation).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
