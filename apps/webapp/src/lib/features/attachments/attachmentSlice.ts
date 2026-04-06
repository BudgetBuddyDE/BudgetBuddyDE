import type {IGetAllAttachmentsQuery} from '@budgetbuddyde/api/attachment';
import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const attachmentSlice = createEntitySlice('attachment', (query?: IGetAllAttachmentsQuery) =>
  apiClient.backend.attachment.getAll(query),
);
