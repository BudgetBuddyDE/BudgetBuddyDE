import type {Logger} from '@budgetbuddyde/logger';
import type {z} from 'zod';
import {BackendError} from '../error';
import {BackendService} from './backend.service';
import type {TAttachment, TGetAttachmentsQuery} from '../types/attachment.type';
import type {TResult} from '../types/common';
import {GetAttachmentResponse} from '../types/schemas/attachment.schema';
import {log} from '../utils/decorators/log.decorator';

export class AttachmentService extends BackendService {
  constructor(host: string, attachmentPath = '/api/attachment', logger?: Logger) {
    super(host, attachmentPath, logger);
  }

  /**
   * Retrieve a single attachment by ID with a signed URL.
   */
  @log
  async getById(
    attachmentId: TAttachment['id'],
    query?: TGetAttachmentsQuery,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<typeof GetAttachmentResponse>>> {
    const params = this.reqQueryObjToURLSearchParams(query);
    return this.requestJson(
      `${this.getBaseRequestPath()}/${attachmentId}?${params.toString()}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      GetAttachmentResponse,
      requestConfig,
    );
  }

  /**
   * Delete a single attachment by ID.
   */
  @log
  async deleteById(attachmentId: TAttachment['id'], requestConfig?: RequestInit): Promise<TResult<void>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}/${attachmentId}`,
        this.mergeRequestConfig(
          {
            method: 'DELETE',
            credentials: 'include',
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      return [undefined, null];
    } catch (error) {
      return this.handleError(error);
    }
  }
}
