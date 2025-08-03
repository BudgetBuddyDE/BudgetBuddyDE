import { z } from 'zod';
import {
  Category,
  ExpandedCategoryStats,
  type TCategory,
  type TCdsDate,
  type TExpandedCategoryStats,
} from '@/types';
import { EntityService } from './Entity.service';
import { Formatter } from '@/utils/Formatter';
import { type ServiceResponse } from '@/types/Service';
import { type OdataQuery, type OdataConfig } from '@tklein1801/o.js';

export class CategoryService extends EntityService {
  private static readonly $entityPath = this.$servicePath + '/Category';

  /**
   * Retrieves the list of categories from the database.
   * @returns A promise that resolves to an array of TCategory objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getCategories(
    query?: OdataQuery,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TCategory[]>> {
    try {
      const records = await this.newOdataHandler(config).get(this.$entityPath).query(query);
      const parsingResult = z.array(Category).safeParse(records);
      if (!parsingResult.success) {
        return this.handleError(new Error('Failed to parse categories'));
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  /**
   * Retrieves the statistics for categories within a specific date range.
   * @param param0 - The start and end dates for the statistics.
   * @returns A promise that resolves to an array of expanded category statistics.
   */
  static async getCategoryStats(
    {
      start,
      end,
    }: {
      start: TCdsDate;
      end: TCdsDate;
    },
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TExpandedCategoryStats[]>> {
    try {
      const startDate = Formatter.date.formatWithPattern(start, 'yyyy-MM-dd');
      const endDate = Formatter.date.formatWithPattern(end, 'yyyy-MM-dd');
      const records = await this.newOdataHandler(config)
        .get(this.$servicePath + '/CategoryStats')
        .query({
          $filter: `processedAt ge ${startDate} and processedAt le ${endDate}`,
          $expand: 'toCategory',
        });
      const parsingResult = z.array(ExpandedCategoryStats).safeParse(records);
      if (!parsingResult.success) {
        return this.handleError(new Error('Failed to parse response'));
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
