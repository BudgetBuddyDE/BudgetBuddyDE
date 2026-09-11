import type {Logger} from '@budgetbuddyde/logger';
import z from 'zod';
import {EntityService} from './entity.service';
import type {TCategory, TCategoryStats, TCategoryVH, TCreateOrUpdateCategoryPayload} from '../types/category.type';
import type {TResult} from '../types/common';
import {
  CategoryStatsResponse,
  CategoryVH,
  CreateCategoryResponse,
  DeleteCategoryResponse,
  GetAllCategoriesResponse,
  GetCategoryResponse,
  MergeCategoriesResponse,
  UpdateCategoryResponse,
} from '../types/schemas/category.schema';
import {log} from '../utils/decorators/log.decorator';

export class CategoryService extends EntityService<
  TCreateOrUpdateCategoryPayload,
  Partial<TCreateOrUpdateCategoryPayload>,
  typeof GetAllCategoriesResponse,
  typeof GetCategoryResponse,
  typeof CreateCategoryResponse,
  typeof UpdateCategoryResponse,
  typeof DeleteCategoryResponse
> {
  constructor(host: string, entityPath = '/api/category', logger?: Logger) {
    super(
      host,
      entityPath,
      {
        getAll: GetAllCategoriesResponse,
        get: GetCategoryResponse,
        create: CreateCategoryResponse,
        update: UpdateCategoryResponse,
        delete: DeleteCategoryResponse,
      },
      logger,
    );
  }

  @log
  async getValueHelp(requestConfig?: RequestInit): Promise<TResult<TCategoryVH[]>> {
    return this.fetchValueHelp(z.array(CategoryVH), requestConfig);
  }

  /**
   * Retrieves the statistics for categories within a specific date range.
   * @param param0 - The start and end dates for the statistics.
   * @returns A promise that resolves to an array of expanded category statistics.
   */
  @log
  async getCategoryStats(
    {
      from,
      to,
    }: {
      from: Date;
      to: Date;
    },
    requestConfig?: RequestInit,
  ): Promise<TResult<TCategoryStats>> {
    const query = new URLSearchParams();
    // en-CA format yields YYYY-MM-DD which is ISO 8601 compliant
    query.append('from', from.toLocaleDateString('en-CA'));
    query.append('to', to.toLocaleDateString('en-CA'));

    const [result, error] = await this.requestJson(
      `${this.getBaseRequestPath()}/stats?${query.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: new Headers(requestConfig?.headers || {}),
      },
      CategoryStatsResponse,
      requestConfig,
    );
    if (error) return [null, error];
    return [result.data ?? [], null];
  }

  @log
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
    TResult<{
      source: Set<TCategory['id']>;
      target: TCategory['id'];
    }>
  > {
    const [result, error] = await this.requestJson(
      `${this.getBaseRequestPath()}/merge`,
      {
        method: 'POST',
        credentials: 'include',
        headers: new Headers({
          'Content-Type': 'application/json',
          ...(requestConfig?.headers || {}),
        }),
        body: JSON.stringify({source, target}),
      },
      MergeCategoriesResponse,
      requestConfig,
    );
    if (error) return [null, error];
    return [result.data, null];
  }
}
