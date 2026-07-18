import {BackendError, ResponseNotJsonError} from '../error';
import {BackendService} from './backend.service';
import type {TResult, TypeOfSchema} from '../types';
import type {IGetHistoricalBalanceQuery} from '../types/interfaces';
import {GetHistoricalBalanceResponse, GetHistoricalCategoryBalanceResponse} from '../types/schemas';
import {log} from '../utils/decorators/log.decorator';

export class InsightsService extends BackendService {
  constructor(host: string) {
    super(host, '/api/insights');
  }

  @log
  async getHistoricalBalance<Query extends IGetHistoricalBalanceQuery>(
    query: Query,
    requestConfig?: RequestInit,
  ): Promise<TResult<TypeOfSchema<typeof GetHistoricalBalanceResponse>>> {
    try {
      const stringifiedQuery = this.reqQueryObjToURLSearchParams(query).toString();
      const response = await this.request(
        `${this.getBaseRequestPath()}/balance?${stringifiedQuery}`,
        this.mergeRequestConfig(
          {
            method: 'GET',
            headers: new Headers(requestConfig?.headers || {}),
            credentials: 'include',
          },
          requestConfig,
        ),
      );

      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = GetHistoricalBalanceResponse.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  @log
  async getHistoricalCategoryBalance<Query extends IGetHistoricalBalanceQuery>(
    query: Query,
    requestConfig?: RequestInit,
  ): Promise<TResult<TypeOfSchema<typeof GetHistoricalCategoryBalanceResponse>>> {
    try {
      const stringifiedQuery = this.reqQueryObjToURLSearchParams(query).toString();
      const response = await this.request(
        `${this.getBaseRequestPath()}/category-balance?${stringifiedQuery}`,
        this.mergeRequestConfig(
          {
            method: 'GET',
            headers: new Headers(requestConfig?.headers || {}),
            credentials: 'include',
          },
          requestConfig,
        ),
      );

      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = GetHistoricalCategoryBalanceResponse.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
