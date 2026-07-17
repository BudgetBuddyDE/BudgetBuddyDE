import {BackendError, ResponseNotJsonError} from '../error';
import {EntityService} from './entity.service';
import type {TResult} from '../types/common';
import type {IGetAllRecurringPaymentsQuery} from '../types/interfaces/recurringPayment.interface';
import type {
  TCreateOrUpdateRecurringPaymentPayload,
  TExecuteRecurringPaymentResponse,
  TExpandedRecurringPayment,
} from '../types/recurringPayment.type';
import {
  CreateRecurringPaymentResponse,
  DeleteRecurringPaymentResponse,
  ExecuteRecurringPaymentResponse,
  GetAllRecurringPaymentsResponse,
  GetRecurringPaymentResponse,
  UpdateRecurringPaymentResponse,
} from '../types/schemas/recurringPayment.schema';

export class RecurringPaymentService extends EntityService<
  TCreateOrUpdateRecurringPaymentPayload,
  Partial<TCreateOrUpdateRecurringPaymentPayload>,
  typeof GetAllRecurringPaymentsResponse,
  typeof GetRecurringPaymentResponse,
  typeof CreateRecurringPaymentResponse,
  typeof UpdateRecurringPaymentResponse,
  typeof DeleteRecurringPaymentResponse
> {
  constructor(host: string, entityPath = '/api/recurringPayment') {
    super(host, entityPath, {
      getAll: GetAllRecurringPaymentsResponse,
      get: GetRecurringPaymentResponse,
      create: CreateRecurringPaymentResponse,
      update: UpdateRecurringPaymentResponse,
      delete: DeleteRecurringPaymentResponse,
    });
  }

  async getAll(query?: IGetAllRecurringPaymentsQuery, requestConfig?: RequestInit) {
    return super.getAll(query, requestConfig);
  }

  determineNextExecutionDate(
    executeAt: TExpandedRecurringPayment['executeAt'],
    interval: TExpandedRecurringPayment['interval'] = 'monthly',
    anchorDate: Date | string = new Date(),
    fromDate = new Date(),
  ): Date {
    const anchor = anchorDate instanceof Date ? anchorDate : new Date(anchorDate);
    const intervalMonths = interval === 'yearly' ? 12 : interval === 'quarterly' ? 3 : 1;
    for (let monthOffset = 0; monthOffset <= intervalMonths; monthOffset += 1) {
      const candidateMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + monthOffset, 1);
      const monthsFromAnchor =
        (candidateMonth.getFullYear() - anchor.getFullYear()) * 12 + candidateMonth.getMonth() - anchor.getMonth();
      if (monthsFromAnchor < 0 || monthsFromAnchor % intervalMonths !== 0) continue;
      const lastDay = new Date(candidateMonth.getFullYear(), candidateMonth.getMonth() + 1, 0).getDate();
      const candidate = new Date(candidateMonth.getFullYear(), candidateMonth.getMonth(), Math.min(executeAt, lastDay));
      if (candidate >= fromDate) return candidate;
    }
    return new Date(fromDate.getFullYear(), fromDate.getMonth() + intervalMonths, executeAt);
  }

  async executePayment(
    recurringPaymentId: string,
    requestConfig?: RequestInit,
  ): Promise<TResult<TExecuteRecurringPaymentResponse>> {
    try {
      const response = await fetch(
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
