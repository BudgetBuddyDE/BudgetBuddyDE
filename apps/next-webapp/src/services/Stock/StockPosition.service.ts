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
  type TStockPositionAllocation,
  StockPositionAllocation,
  RelatedAsset,
  type TRelatedAsset,
  AssetServiceSchemas,
} from '@/types';
import z from 'zod';
import { AssetIdentifier } from '@/types/Stocks/Parqet';
import { TTimeframe } from '@/components/Stocks/AssetPriceChart';

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

  // TODO: Move to AssetService.assets
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

  // TODO: Move to AssetService.assets
  static async getAssets(
    identifiers: z.infer<typeof AssetIdentifier>[],
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<z.infer<typeof AssetServiceSchemas.Asset>[]>> {
    try {
      const query = new URLSearchParams();
      identifiers.forEach((id) => {
        query.append('identifier', id);
      });

      const records = await this.newOdataHandler(config)
        .get(`${this.$servicePath}/Asset?${query.toString()}`)
        .query();

      const parsingResult = z.array(AssetServiceSchemas.Asset).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  // TODO: Move to AssetService.assets
  static async getAsset(
    identifier: string,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<z.infer<typeof AssetServiceSchemas.Asset>>> {
    try {
      const query = new URLSearchParams();
      query.append('identifier', identifier);

      const records = await this.newOdataHandler(config)
        .get(`${this.$servicePath}/Asset?${query.toString()}`)
        .query();

      const parsingResult = AssetServiceSchemas.Asset.safeParse(records[0]);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async getAssetQuotes(
    identifier: z.infer<typeof AssetIdentifier>,
    timeframe: TTimeframe,
    currency: string = 'EUR',
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<z.infer<typeof AssetServiceSchemas.AssetQuote>>> {
    try {
      const query = new URLSearchParams();
      query.append('identifier', identifier);
      query.append('timeframe', timeframe);
      query.append('currency', currency);

      const records = await this.newOdataHandler(config)
        .get(`${this.$servicePath}/AssetQuote?${query.toString()}`)
        .query();

      const parsingResult = z.array(AssetServiceSchemas.AssetQuote).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data[0], null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  // TODO: Move to AssetService.assets
  static async getRelatedAssets(
    isin: string,
    includeQuotes: boolean = false,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TRelatedAsset[]>> {
    try {
      const query = new URLSearchParams();
      query.set('identifier', isin);
      if (includeQuotes) {
        query.set('$expand', 'quotes');
      }

      const records = await this.newOdataHandler(config)
        .get(`${this.$servicePath}/RelatedAsset?${query.toString()}`)
        .query();

      const parsingResult = z.array(RelatedAsset).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
