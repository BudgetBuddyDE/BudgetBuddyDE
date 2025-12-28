/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type {ServiceResponse} from '@budgetbuddyde/types';
import {z} from 'zod';
import {
  ApiResponse,
  PaymentMethod,
  PaymentMethodVH,
  type TCreateOrUpdatePaymentMethod,
  type TPaymentMethod,
  type TPaymentMethodVH,
} from '@/types';
import {NewEntityService} from './Entity.service';

const GetAllPaymentMethods = ApiResponse.extend({
  data: z.array(PaymentMethod).nullable(),
});
const GetPaymentMethod = ApiResponse.extend({
  data: PaymentMethod.nullable(),
});
const PostPaymentMethod = GetAllPaymentMethods;
const PutPaymentMethod = GetAllPaymentMethods;
const DeletePaymentMethod = GetAllPaymentMethods;

export class PaymentMethodService extends NewEntityService<
  TCreateOrUpdatePaymentMethod,
  TCreateOrUpdatePaymentMethod,
  typeof GetAllPaymentMethods,
  typeof GetPaymentMethod,
  typeof PostPaymentMethod,
  typeof PutPaymentMethod,
  typeof DeletePaymentMethod
> {
  constructor() {
    super('/api/paymentMethod', {
      getAll: GetAllPaymentMethods,
      get: GetPaymentMethod,
      create: PostPaymentMethod,
      update: PutPaymentMethod,
      delete: DeletePaymentMethod,
    });
  }

  async getValueHelp(requestConfig?: RequestInit): Promise<ServiceResponse<TPaymentMethodVH[]>> {
    const [paymentMethods, error] = await this.getAll(undefined, requestConfig);
    if (error) {
      this.handleError(error);
    }

    const valueHelpValues = z.array(PaymentMethodVH).safeParse(paymentMethods?.data ?? []);
    if (!valueHelpValues.success) {
      return this.handleZodError(valueHelpValues.error);
    }
    return [valueHelpValues.data, null];
  }

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
    ServiceResponse<{
      source: Set<TPaymentMethod['id']>;
      target: TPaymentMethod['id'];
    }>
  > {
    try {
      const response = await fetch(
        `${this.getBaseRequestPath()}/merge`,
        this.mergeRequestConfig(
          {
            method: 'POST',
            credentials: 'include',
            headers: new Headers({
              'Content-Type': 'application/json',
              ...(requestConfig?.headers || {}),
            }),
            body: JSON.stringify({source, target}),
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new Error(`Failed to merge payment methods: ${response.statusText}`);
      }
      if (!this.isJsonResponse(response)) {
        throw new Error('Response is not JSON');
      }
      const data = await response.json();

      const parsingResult = ApiResponse.extend({
        data: z.object({
          source: z.array(PaymentMethod.shape.id).transform(ids => new Set(ids)),
          target: PaymentMethod.shape.id,
        }),
      }).safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }
}
