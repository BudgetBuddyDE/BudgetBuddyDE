import type {TAttachmentWithUrl, TGetAttachmentsQuery} from '@budgetbuddyde/api/attachment';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';

export async function loadAttachmentPage(
  page: number,
  pageSize: number,
): Promise<{attachments: TAttachmentWithUrl[]; totalCount: number; error?: string}> {
  const headers = await getForwardedHeaders();
  const from = (page - 1) * pageSize;
  const [response, error] = await apiClient.backend.transaction.getAllTransactionAttachments(
    {from, to: from + pageSize, ttl: 300 as TGetAttachmentsQuery['ttl']},
    {headers, cache: 'no-store'},
  );
  return {
    attachments: response?.data ?? [],
    totalCount: response?.totalCount ?? 0,
    error: error ? 'Attachments could not be loaded.' : undefined,
  };
}
