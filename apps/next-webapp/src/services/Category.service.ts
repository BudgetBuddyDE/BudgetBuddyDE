import { z } from 'zod';
import {
  CategoriesWithCount,
  Category,
  CategoryResponse,
  ExpandedCategoryStats,
  type TCategoryResponse,
  type TCreateOrUpdateCategory,
  type TCategoriesWithCount,
  type TCategory,
  type TCdsDate,
  type TExpandedCategoryStats,
  type TCategory_VH,
  Category_VH,
} from '@/types';
import { EntityService } from './Entity.service';
import { Formatter } from '@/utils/Formatter';
import { type ServiceResponse } from '@budgetbuddyde/types';
import { type OdataQuery, type OdataConfig } from '@tklein1801/o.js';

export class CategoryService extends EntityService {
  static {
    this.entity = 'Category';
  }

  /**
   * Creates a new category.
   * @param payload The category data to create.
   * @returns A promise that resolves to the created category or an error.
   */
  static async createCategory(
    payload: TCreateOrUpdateCategory
  ): Promise<ServiceResponse<TCategoryResponse>> {
    try {
      const record = await this.newOdataHandler().post(this.$entityPath, payload).query();
      const parsingResult = CategoryResponse.safeParse(record);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  /**
   * Updates an existing category.
   * @param entityId The ID of the category to update.
   * @param payload The updated category data.
   * @returns A promise that resolves to the updated category or an error.
   */
  static async update(
    entityId: string,
    payload: TCreateOrUpdateCategory
  ): Promise<ServiceResponse<TCategory>> {
    try {
      const record = await this.newOdataHandler()
        .patch(`${this.$entityPath}(ID=${entityId})`, payload)
        .query();
      const parsingResult = CategoryResponse.safeParse(record);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

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
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  /**
   * Retrieves the list of categories from the database with a count of total categories.
   * @param query - The OData query parameters.
   * @param config - The OData configuration options.
   * @returns A promise that resolves to a ServiceResponse containing the categories and their count.
   */
  static async getCategoriesWithCount(
    query?: Omit<OdataQuery, '$count'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TCategoriesWithCount>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$entityPath)
        .query({ ...query, $count: true });
      this.logger.debug('Fetched categories:', records);
      const parsingResult = CategoriesWithCount.safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
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
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  static async getCategoryVH(
    query?: OdataQuery,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TCategory_VH[]>> {
    try {
      const records = await this.newOdataHandler(config)
        .get(this.$servicePath + '/Category_VH')
        .query(query);
      const parsingResult = z.array(Category_VH).safeParse(records);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
