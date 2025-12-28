/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type {ServiceResponse} from '@budgetbuddyde/types';
import {z} from 'zod';
import {
  ApiResponse,
  Category,
  CategoryStats,
  CategoryVH,
  type TCategory,
  type TCategoryStats,
  type TCategoryVH,
  type TCreateOrUpdateCategory,
} from '@/types';
import {Formatter} from '@/utils/Formatter';
import {NewEntityService} from './Entity.service';

const GetAllCategories = ApiResponse.extend({
  data: z.array(Category).nullable(),
});
const GetCategory = ApiResponse.extend({
  data: Category.nullable(),
});
const PostCategory = GetAllCategories;
const PutCategory = GetAllCategories;
const DeleteCategory = GetAllCategories;

export class CategoryService extends NewEntityService<
  TCreateOrUpdateCategory,
  TCreateOrUpdateCategory,
  typeof GetAllCategories,
  typeof GetCategory,
  typeof PostCategory,
  typeof PutCategory,
  typeof DeleteCategory
> {
  constructor() {
    super('/api/category', {
      getAll: GetAllCategories,
      get: GetCategory,
      create: PostCategory,
      update: PutCategory,
      delete: DeleteCategory,
    });
  }

  async getValueHelp(requestConfig?: RequestInit): Promise<ServiceResponse<TCategoryVH[]>> {
    const [categories, error] = await this.getAll(undefined, requestConfig);
    if (error) {
      this.handleError(error);
    }

    const valueHelpValues = z.array(CategoryVH).safeParse(categories?.data ?? []);
    if (!valueHelpValues.success) {
      return this.handleZodError(valueHelpValues.error);
    }
    return [valueHelpValues.data, null];
  }

  /**
   * Retrieves the statistics for categories within a specific date range.
   * @param param0 - The start and end dates for the statistics.
   * @returns A promise that resolves to an array of expanded category statistics.
   */
  async getCategoryStats(
    {
      from,
      to,
    }: {
      from: Date;
      to: Date;
    },
    requestConfig?: RequestInit,
  ): Promise<ServiceResponse<TCategoryStats>> {
    try {
      const query = new URLSearchParams();
      const dateFormat = 'yyyy-MM-dd' as const;
      query.append('from', Formatter.date.formatWithPattern(from, dateFormat));
      query.append('to', Formatter.date.formatWithPattern(to, dateFormat));

      const response = await fetch(
        `${this.getBaseRequestPath()}/stats?${query.toString()}`,
        this.mergeRequestConfig(
          {
            method: 'GET',
            credentials: 'include',
            headers: new Headers(requestConfig?.headers || {}),
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      if (!this.isJsonResponse(response)) {
        throw new Error('Response is not JSON');
      }
      const data = await response.json();

      const parsingResult = ApiResponse.extend({
        data: CategoryStats,
      }).safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data.data ?? [], null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  async merge(
    {
      source,
      target,
    }: {
      source: TCategory['id'][];
      target: TCategory['id'];
    },
    requestConfig?: RequestInit,
  ): Promise<
    ServiceResponse<{
      source: Set<TCategory['id']>;
      target: TCategory['id'];
    }>
  > {
    try {
      const response = await fetch(
        `${this.getBaseRequestPath()}/merge`,
        this.mergeRequestConfig(
          {
            method: 'POST',
            credentials: 'include',
            headers: new Headers({
              'Content-Type': 'application/json',
              ...(requestConfig?.headers || {}),
            }),
            body: JSON.stringify({source, target}),
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      if (!this.isJsonResponse(response)) {
        throw new Error('Response is not JSON');
      }
      const data = await response.json();

      const parsingResult = ApiResponse.extend({
        data: z.object({
          source: z.array(Category.shape.id).transform(ids => new Set(ids)),
          target: Category.shape.id,
        }),
      }).safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }
}
