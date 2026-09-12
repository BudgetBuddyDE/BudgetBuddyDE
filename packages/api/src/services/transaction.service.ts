import type {Logger} from '@budgetbuddyde/logger';
import type {z} from 'zod';
import {EntityService} from './entity.service';
import type {TResult} from '../types/common';
import type {IGetAllTransactionsQuery} from '../types/interfaces/transaction.interface';
import {
  CreateTransactionResponse,
  DeleteTransactionResponse,
  GetAllTransactionsResponse,
  GetTransactionAttachmentsResponse,
  GetTransactionResponse,
  ReceiverVHResponse,
  UpdateTransactionResponse,
  UploadTransactionAttachmentsResponse,
} from '../types/schemas/transaction.schema';
import type {
  TCreateOrUpdateTransactionPayload,
  TDeleteTransactionAttachmentsPayload,
  TGetTransactionAttachmentsQuery,
  TReceiverVH,
} from '../types/transaction.type';
import {log} from '../utils/decorators/log.decorator';

export class TransactionService extends EntityService<
  TCreateOrUpdateTransactionPayload,
  Partial<TCreateOrUpdateTransactionPayload>,
  typeof GetAllTransactionsResponse,
  typeof GetTransactionResponse,
  typeof CreateTransactionResponse,
  typeof UpdateTransactionResponse,
  typeof DeleteTransactionResponse
> {
  constructor(host: string, entityPath = '/api/transaction', logger?: Logger) {
    super(
      host,
      entityPath,
      {
        getAll: GetAllTransactionsResponse,
        get: GetTransactionResponse,
        create: CreateTransactionResponse,
        update: UpdateTransactionResponse,
        delete: DeleteTransactionResponse,
      },
      logger,
    );
  }

  async getAll(query?: IGetAllTransactionsQuery, requestConfig?: RequestInit) {
    return super.getAll(query, requestConfig);
  }

  @log
  async getReceiverVH(requestConfig?: RequestInit): Promise<TResult<TReceiverVH[]>> {
    const [result, error] = await this.requestJson(
      `${this.getBaseRequestPath()}/receiver`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      ReceiverVHResponse,
      requestConfig,
    );
    if (error) return [null, error];
    return [result.data ?? [], null];
  }

  /**
   * Fetch all transaction attachments for the authenticated user (across all transactions).
   */
  @log
  async getAllTransactionAttachments(
    query?: TGetTransactionAttachmentsQuery,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<typeof GetTransactionAttachmentsResponse>>> {
    const params = this.reqQueryObjToURLSearchParams(query);
    return this.requestJson(
      `${this.getBaseRequestPath()}/attachments?${params.toString()}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      GetTransactionAttachmentsResponse,
      requestConfig,
    );
  }

  /**
   * Fetch all attachments for a specific transaction.
   */
  @log
  async getTransactionAttachments(
    transactionId: string,
    query?: TGetTransactionAttachmentsQuery,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<typeof GetTransactionAttachmentsResponse>>> {
    const params = this.reqQueryObjToURLSearchParams(query);
    return this.requestJson(
      `${this.getBaseRequestPath()}/${transactionId}/attachments?${params.toString()}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      GetTransactionAttachmentsResponse,
      requestConfig,
    );
  }

  /**
   * Upload attachments for a specific transaction.
   */
  @log
  async uploadTransactionAttachments(
    transactionId: string,
    files: File[],
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<typeof UploadTransactionAttachmentsResponse>>> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    return this.requestJson(
      `${this.getBaseRequestPath()}/${transactionId}/attachments`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      },
      UploadTransactionAttachmentsResponse,
      requestConfig,
    );
  }

  /**
   * Delete attachments from a specific transaction.
   * Optionally pass specific attachment IDs; if omitted, all transaction attachments are deleted.
   */
  @log
  async deleteTransactionAttachments(
    transactionId: string,
    payload?: TDeleteTransactionAttachmentsPayload,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<typeof DeleteTransactionResponse>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/${transactionId}/attachments`,
      {
        method: 'DELETE',
        headers: new Headers(requestConfig?.headers || {'Content-Type': 'application/json'}),
        credentials: 'include',
        body: payload ? JSON.stringify(payload) : undefined,
      },
      DeleteTransactionResponse,
      requestConfig,
    );
  }
}
