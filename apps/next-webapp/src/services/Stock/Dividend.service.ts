import { z } from 'zod';
import { type ServiceResponse } from '@/types/Service';
import { EntityService } from '../Entity.service';
import { type OdataConfig } from '@tklein1801/o.js';
import { Dividend, type TDividend } from '@/types/Stocks/Dividend';
import { ISIN } from '@/types/Stocks/Parqet';

export class DividendService extends EntityService {
  static {
    this.$servicePath = '/odata/v4/asset';
    this.entity = 'Dividend';
  }

  static async get(
    query?: Partial<{ identifier: z.infer<typeof ISIN>[]; future: boolean; historical: boolean }>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TDividend[]>> {
    try {
      const searchQuery = new URLSearchParams();
      if (query?.future) {
        searchQuery.append('future', 'true');
      }
      if (query?.historical) {
        searchQuery.append('historical', 'true');
      }
      if (query?.identifier) {
        for (const isin of query.identifier) {
          searchQuery.append('identifier', isin);
        }
      }

      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(`${this.$entityPath}?${searchQuery.toString()}`)
        .query();
      this.logger.debug('Fetched dividends:', records);
      const parsingResult = z.array(Dividend).safeParse(records.value);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async delete(): Promise<ServiceResponse<true>> {
    return [null, new Error('Dividends cannot be deleted.')];
  }
}
