import type {Logger} from '@budgetbuddyde/logger';
import {BackendService} from './backend.service';
import type {TResult, TypeOfSchema} from '../types';
import type {IGetHistoricalBalanceQuery} from '../types/interfaces';
import {GetHistoricalBalanceResponse, GetHistoricalCategoryBalanceResponse} from '../types/schemas';
import {log} from '../utils/decorators/log.decorator';

export class InsightsService extends BackendService {
  constructor(host: string, logger?: Logger) {
    super(host, '/api/insights', logger);
  }

  @log
  async getHistoricalBalance<Query extends IGetHistoricalBalanceQuery>(
    query: Query,
    requestConfig?: RequestInit,
  ): Promise<TResult<TypeOfSchema<typeof GetHistoricalBalanceResponse>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/balance?${this.reqQueryObjToURLSearchParams(query).toString()}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      GetHistoricalBalanceResponse,
      requestConfig,
    );
  }

  @log
  async getHistoricalCategoryBalance<Query extends IGetHistoricalBalanceQuery>(
    query: Query,
    requestConfig?: RequestInit,
  ): Promise<TResult<TypeOfSchema<typeof GetHistoricalCategoryBalanceResponse>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/category-balance?${this.reqQueryObjToURLSearchParams(query).toString()}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      GetHistoricalCategoryBalanceResponse,
      requestConfig,
    );
  }
}
