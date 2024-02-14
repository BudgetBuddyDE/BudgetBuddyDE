import { z } from 'zod';
import {
  ZSubscription,
  type TApiResponse,
  type TCreateSubscriptionPayload,
  type TCreateTransactionPayload,
  type TDeleteSubscriptionPayload,
  type TSubscription,
  type TUpdateSubscriptionPayload,
  type TDeleteSubscriptionResponsePayload,
  ZDeleteSubscriptionResponsePayload,
} from '@budgetbuddyde/types';
import { determineNextExecutionDate, prepareRequestOptions } from '@/utils';
import { type IAuthContext } from '../Auth';
import { isRunningInProdEnv } from '@/utils/isRunningInProdEnv.util';

export class SubscriptionService {
  private static host =
    (isRunningInProdEnv() ? (process.env.BACKEND_HOST as string) : '/api') + '/v1/subscription';

  static async getSubscriptionsByUuid(
    { uuid, password }: IAuthContext['authOptions'],
    requestOptions?: RequestInit
  ): Promise<[TSubscription[] | null, Error | null]> {
    try {
      const query = new URLSearchParams();
      query.append('uuid', uuid);
      const response = await fetch(this.host + '?' + query.toString(), {
        ...prepareRequestOptions({ uuid, password }),
        ...requestOptions,
      });
      const json = (await response.json()) as TApiResponse<TSubscription[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZSubscription).safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static async create(
    subscription: TCreateSubscriptionPayload,
    user: IAuthContext['authOptions']
  ): Promise<[TSubscription | null, Error | null]> {
    try {
      const response = await fetch(this.host, {
        method: 'POST',
        body: JSON.stringify(subscription),
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TSubscription>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZSubscription.safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static async update(
    subscription: TUpdateSubscriptionPayload,
    user: IAuthContext['authOptions']
  ): Promise<[TSubscription | null, Error | null]> {
    try {
      const response = await fetch(this.host, {
        method: 'PUT',
        body: JSON.stringify(subscription),
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TSubscription>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZSubscription.safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static async delete(
    subscription: TDeleteSubscriptionPayload,
    user: IAuthContext['authOptions']
  ): Promise<[TDeleteSubscriptionResponsePayload | null, Error | null]> {
    try {
      const response = await fetch(this.host, {
        method: 'DELETE',
        body: JSON.stringify(subscription),
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TDeleteSubscriptionResponsePayload>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZDeleteSubscriptionResponsePayload.safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static getUpdateValues({
    id,
    executeAt,
    paused,
    receiver,
    category,
    paymentMethod,
    transferAmount,
    description,
  }: TSubscription): TUpdateSubscriptionPayload {
    return {
      subscriptionId: id,
      paused: paused,
      executeAt: executeAt,
      receiver: receiver,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      transferAmount: transferAmount,
      description: description,
    };
  }

  static getCreateTransactionPayload({
    executeAt,
    owner,
    category,
    paymentMethod,
    receiver,
    transferAmount,
    description,
  }: TSubscription): TCreateTransactionPayload {
    return {
      owner: owner.uuid,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      receiver: receiver,
      description: description,
      transferAmount: transferAmount,
      processedAt: determineNextExecutionDate(executeAt),
    };
  }

  static sortByExecutionDate(subscriptions: TSubscription[]): TSubscription[] {
    const today = new Date().getDate();
    return subscriptions.sort((a, b) => {
      if (a.executeAt <= today && b.executeAt > today) {
        return 1; // Move already paid subscriptions to the end
      } else if (a.executeAt > today && b.executeAt <= today) {
        return -1; // Keep unpaid subscriptions at the beginning
      } else {
        return a.executeAt - b.executeAt; // Sort by executeAt for the rest
      }
    });
  }

  static getPlannedBalanceByType(
    subscriptions: TSubscription[],
    type: 'INCOME' | 'SPENDINGS' = 'INCOME'
  ): TSubscription[] {
    return this.sortByExecutionDate(
      subscriptions.filter(({ transferAmount }) =>
        type === 'INCOME' ? transferAmount > 0 : transferAmount < 0
      )
    );
  }

  /**
   * Converts a subscription object to an update payload object.
   * @param subscription - The subscription object to be converted.
   * @returns The update payload object.
   */
  static toUpdatePayload(subscription: TSubscription): TUpdateSubscriptionPayload {
    return {
      subscriptionId: subscription.id,
      paused: subscription.paused,
      executeAt: subscription.executeAt,
      receiver: subscription.receiver,
      categoryId: subscription.category.id,
      paymentMethodId: subscription.paymentMethod.id,
      transferAmount: subscription.transferAmount,
      description: subscription.description,
    };
  }
}
