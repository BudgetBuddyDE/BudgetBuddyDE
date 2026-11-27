import type {Logger} from '@budgetbuddyde/logger';
import z from 'zod';
import {EntityService} from './entity.service';
import type {TCategory, TCategoryStats, TCategoryVH, TCreateOrUpdateCategoryPayload} from '../types/category.type';
import type {TResult} from '../types/common';
import {
  CategoryBreakdownResponse,
  CategoryStatsResponse,
  CategoryVH,
  ConfirmCategoryDeletion,
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
  Partial<TCreateOrUpdateCategoryPayload> & {expectedParentId?: TCategory['parentId']},
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

  async getMonthlyBreakdown(entityId: string, month: Date, requestConfig?: RequestInit) {
    const query = new URLSearchParams({month: month.toLocaleDateString('en-CA')});
    const [result, error] = await this.requestJson(
      `${this.getBaseRequestPath()}/${encodeURIComponent(entityId)}/breakdown?${query}`,
      {method: 'GET', credentials: 'include'},
      CategoryBreakdownResponse,
      requestConfig,
    );
    return error ? ([null, error] as const) : ([result.data, null] as const);
  }

  /** Move only if the current parent matches the placement shown in the confirmation. */
  async moveConfirmed(
    entityId: string,
    changes: Partial<TCreateOrUpdateCategoryPayload> & {parentId: NonNullable<TCategory['parentId']> | null},
    expectedParentId: NonNullable<TCategory['parentId']> | null,
    requestConfig?: RequestInit,
  ) {
    const payload = {...changes, expectedParentId};
    return this.updateById(entityId, payload, requestConfig);
  }

  /** Delete only if the current child IDs match those shown in the confirmation. */
  async deleteConfirmed(
    entityId: string,
    confirmation: z.input<typeof ConfirmCategoryDeletion>,
    requestConfig?: RequestInit,
  ) {
    const headers = new Headers(requestConfig?.headers);
    headers.set('Content-Type', 'application/json');
    return this.deleteById(entityId, {...requestConfig, headers, body: JSON.stringify(confirmation)});
  }

  /**
   * Retrieves the statistics for categories within a specific date range.
   * @param param0 - The start and end dates for the statistics.
   * @returns A promise that resolves to an array of expanded category statistics.
   */
  @log
  async getCategoryStats(range: {from: Date; to: Date}, requestConfig?: RequestInit): Promise<TResult<TCategoryStats>> {
    return this.readCategoryStats(range, requestConfig);
  }

  /** Aggregate whole calendar months, using the current root membership. */
  async getRootCategoryStats(range: {from: Date; to: Date; exact?: boolean}, requestConfig?: RequestInit) {
    return this.readCategoryStats(range, requestConfig, 'root', range.exact);
  }

  /** Aggregate whole calendar months for child categories only. */
  async getChildCategoryStats(range: {from: Date; to: Date}, requestConfig?: RequestInit) {
    return this.readCategoryStats(range, requestConfig, 'child');
  }

  private async readCategoryStats(
    {
      from,
      to,
    }: {
      from: Date;
      to: Date;
    },
    requestConfig?: RequestInit,
    level?: 'root' | 'child',
    exact?: boolean,
  ): Promise<TResult<TCategoryStats>> {
    const query = new URLSearchParams();
    // en-CA format yields YYYY-MM-DD which is ISO 8601 compliant
    query.append('from', from.toLocaleDateString('en-CA'));
    query.append('to', to.toLocaleDateString('en-CA'));
    if (level) query.set('level', level);
    if (exact) query.set('exact', 'true');

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
