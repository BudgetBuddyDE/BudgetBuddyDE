/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type {ServiceResponse} from '@budgetbuddyde/types';
import {z} from 'zod';
import {
  ApiResponse,
  ExpandedTransaction,
  ReceiverVH,
  type TCreateOrUpdateTransaction,
  type TReceiverVH,
  Transaction,
} from '@/types';
import {type BaseGetAllQuery, NewEntityService} from './Entity.service';

const GetAllTransaction = ApiResponse.extend({
  data: z.array(ExpandedTransaction).nullable(),
});

const GetTransaction = ApiResponse.extend({
  data: ExpandedTransaction.nullable(),
});
const PostTransaction = ApiResponse.extend({
  data: z.array(Transaction).nullable(),
});
const PutTransaction = PostTransaction;
const DeleteTransaction = PostTransaction;

export type GetAllTransactionsQuery = BaseGetAllQuery & {
  $dateFrom?: Date;
  $dateTo?: Date;
};

export class TransactionService extends NewEntityService<
  TCreateOrUpdateTransaction,
  TCreateOrUpdateTransaction,
  typeof GetAllTransaction,
  typeof GetTransaction,
  typeof PostTransaction,
  typeof PutTransaction,
  typeof DeleteTransaction
> {
  constructor() {
    super('/api/transaction', {
      getAll: GetAllTransaction,
      get: GetTransaction,
      create: PostTransaction,
      update: PutTransaction,
      delete: DeleteTransaction,
    });
  }

  async getAll(query?: GetAllTransactionsQuery, requestConfig?: RequestInit) {
    return super.getAll(query, requestConfig);
  }

  async getReceiverVH(requestConfig?: RequestInit): Promise<ServiceResponse<TReceiverVH[]>> {
    try {
      const response = await fetch(
        `${this.getBaseRequestPath()}/receiver`,
        this.mergeRequestConfig(
          {
            method: 'GET',
            headers: this.enhanceHeadersWithRequestId(new Headers(requestConfig?.headers || {})),
            credentials: 'include',
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch entities: ${response.statusText}`);
      }
      if (!this.isJsonResponse(response)) {
        throw new Error('Response is not JSON');
      }
      const data = await response.json();

      const parsingResult = ApiResponse.extend({
        data: z.array(ReceiverVH).nullable(),
      }).safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data.data ?? [], null];
    } catch (error) {
      return this.handleError(error);
    }
  }
}
