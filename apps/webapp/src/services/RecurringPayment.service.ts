/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import {z} from 'zod';
import {
  ApiResponse,
  ExpandedRecurringPayment,
  RecurringPayment,
  type TCreateOrUpdateRecurringPayment,
  type TExpandedRecurringPayment,
} from '@/types';
import {type BaseGetAllQuery, NewEntityService} from './Entity.service';

const GetAllRecurringPayment = ApiResponse.extend({
  data: z.array(ExpandedRecurringPayment).nullable(),
});

const GetRecurringPayment = ApiResponse.extend({
  data: ExpandedRecurringPayment.nullable(),
});
const PostRecurringPayment = ApiResponse.extend({
  data: z.array(RecurringPayment).nullable(),
});
const PutRecurringPayment = PostRecurringPayment;
const DeleteRecurringPayment = PostRecurringPayment;

export class RecurringPaymentService extends NewEntityService<
  TCreateOrUpdateRecurringPayment,
  TCreateOrUpdateRecurringPayment,
  typeof GetAllRecurringPayment,
  typeof GetRecurringPayment,
  typeof PostRecurringPayment,
  typeof PutRecurringPayment,
  typeof DeleteRecurringPayment
> {
  constructor() {
    super('/api/recurringPayment', {
      getAll: GetAllRecurringPayment,
      get: GetRecurringPayment,
      create: PostRecurringPayment,
      update: PutRecurringPayment,
      delete: DeleteRecurringPayment,
    });
  }

  async getAll(
    query?: BaseGetAllQuery & {
      $executeFrom?: number;
      $executeTo?: number;
    },
    requestConfig?: RequestInit,
  ) {
    return super.getAll(query, requestConfig);
  }

  determineNextExecutionDate(executeAt: TExpandedRecurringPayment['executeAt']): Date {
    const today = new Date();
    return today.getDate() < executeAt
      ? new Date(today.getFullYear(), today.getMonth(), executeAt)
      : new Date(today.getFullYear(), today.getMonth() + 1, executeAt);
  }
}
