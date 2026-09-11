import type {Logger} from '@budgetbuddyde/logger';
import z from 'zod';
import {EntityService} from './entity.service';
import type {TResult} from '../types/common';
import type {TCreateOrUpdatePaymentMethodPayload, TPaymentMethod, TPaymentMethodVH} from '../types/paymentMethod.type';
import {
  CreatePaymentMethodResponse,
  DeletePaymentMethodResponse,
  GetAllPaymentMethodsResponse,
  GetPaymentMethodResponse,
  MergePaymentMethodsResponse,
  PaymentMethodVH,
  UpdatePaymentMethodResponse,
} from '../types/schemas/paymentMethod.schema';
import {log} from '../utils/decorators/log.decorator';

export class PaymentMethodService extends EntityService<
  TCreateOrUpdatePaymentMethodPayload,
  Partial<TCreateOrUpdatePaymentMethodPayload>,
  typeof GetAllPaymentMethodsResponse,
  typeof GetPaymentMethodResponse,
  typeof CreatePaymentMethodResponse,
  typeof UpdatePaymentMethodResponse,
  typeof DeletePaymentMethodResponse
> {
  constructor(host: string, entityPath = '/api/paymentMethod', logger?: Logger) {
    super(
      host,
      entityPath,
      {
        getAll: GetAllPaymentMethodsResponse,
        get: GetPaymentMethodResponse,
        create: CreatePaymentMethodResponse,
        update: UpdatePaymentMethodResponse,
        delete: DeletePaymentMethodResponse,
      },
      logger,
    );
  }

  @log
  async getValueHelp(requestConfig?: RequestInit): Promise<TResult<TPaymentMethodVH[]>> {
    return this.fetchValueHelp(z.array(PaymentMethodVH), requestConfig);
  }

  @log
  async merge(
    {
      source,
      target,
    }: {
      source: TPaymentMethod['id'][];
      target: TPaymentMethod['id'];
    },
    requestConfig?: RequestInit,
  ): Promise<
    TResult<{
      source: Set<TPaymentMethod['id']>;
      target: TPaymentMethod['id'];
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
      MergePaymentMethodsResponse,
      requestConfig,
    );
    if (error) return [null, error];
    return [result.data, null];
  }
}
