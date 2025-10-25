import { z } from 'zod';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';
import { EntityService } from '../Entity.service';
import { Metal, MetalQuote, type TMetal, type TMetalQuote } from '@/types/Stocks/Metal';
import { ServiceResponse } from '@budgetbuddyde/types';

export class MetalService extends EntityService {
  static {
    this.$servicePath = '/odata/v4/asset';
    this.entity = 'Metal';
  }

  static async getList(
    query?: Omit<OdataQuery, '$count' | '$expand'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TMetal[]>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$entityPath)
        .query(query);
      const parsingResult = z.array(Metal).safeParse(records.value);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async getListWithQuotes(
    query?: Omit<OdataQuery, '$count' | '$expand'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TMetalQuote[]>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$servicePath + '/MetalQuote')
        .query(query);
      const parsingResult = z.array(MetalQuote).safeParse(records.value);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
