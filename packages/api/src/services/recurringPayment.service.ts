import type {Logger} from '@budgetbuddyde/logger';
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
    const params = this.reqQueryObjToURLSearchParams(query);
    return this.requestJson(
      `${this.getBaseRequestPath()}/occurrences?${params.toString()}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      GetRecurringPaymentOccurrencesResponse,
      requestConfig,
    );
  }

  @log
  async executePayment(
    recurringPaymentId: string,
    requestConfig?: RequestInit,
  ): Promise<TResult<TExecuteRecurringPaymentResponse>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/${recurringPaymentId}/execute`,
      {
        method: 'POST',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      ExecuteRecurringPaymentResponse,
      requestConfig,
    );
  }
}
