import type {Logger} from '@budgetbuddyde/logger';
import {BackendError, ResponseNotJsonError} from '../error';
import {EntityService} from './entity.service';
import type {TResult} from '../types/common';
import type {
  IGetAllRecurringPaymentsQuery,
  IGetRecurringPaymentOccurrencesQuery,
} from '../types/interfaces/recurringPayment.interface';
import type {
  TCreateOrUpdateRecurringPaymentPayload,
  TExecuteRecurringPaymentResponse,
  TGetRecurringPaymentOccurrencesResponse,
} from '../types/recurringPayment.type';
import {
  CreateRecurringPaymentResponse,
  DeleteRecurringPaymentResponse,
  ExecuteRecurringPaymentResponse,
  GetAllRecurringPaymentsResponse,
  GetRecurringPaymentOccurrencesResponse,
  GetRecurringPaymentResponse,
  UpdateRecurringPaymentResponse,
} from '../types/schemas/recurringPayment.schema';
import {log} from '../utils/decorators/log.decorator';

export class RecurringPaymentService extends EntityService<
  TCreateOrUpdateRecurringPaymentPayload,
  Partial<TCreateOrUpdateRecurringPaymentPayload>,
  typeof GetAllRecurringPaymentsResponse,
  typeof GetRecurringPaymentResponse,
  typeof CreateRecurringPaymentResponse,
  typeof UpdateRecurringPaymentResponse,
  typeof DeleteRecurringPaymentResponse
> {
  constructor(host: string, entityPath = '/api/recurringPayment', logger?: Logger) {
    super(
      host,
      entityPath,
      {
        getAll: GetAllRecurringPaymentsResponse,
        get: GetRecurringPaymentResponse,
        create: CreateRecurringPaymentResponse,
        update: UpdateRecurringPaymentResponse,
        delete: DeleteRecurringPaymentResponse,
      },
      logger,
    );
  }

  async getAll(query?: IGetAllRecurringPaymentsQuery, requestConfig?: RequestInit) {
    return super.getAll(query, requestConfig);
  }

  @log
  async getOccurrences(
    query: IGetRecurringPaymentOccurrencesQuery,
    requestConfig?: RequestInit,
  ): Promise<TResult<TGetRecurringPaymentOccurrencesResponse>> {
    try {
      const params = this.reqQueryObjToURLSearchParams(query);
      const response = await this.request(
        `${this.getBaseRequestPath()}/occurrences?${params.toString()}`,
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

      const parsingResult = GetRecurringPaymentOccurrencesResponse.safeParse(await response.json());
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  @log
  async executePayment(
    recurringPaymentId: string,
    requestConfig?: RequestInit,
  ): Promise<TResult<TExecuteRecurringPaymentResponse>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}/${recurringPaymentId}/execute`,
        this.mergeRequestConfig(
          {
            method: 'POST',
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

      const parsingResult = ExecuteRecurringPaymentResponse.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }
}
