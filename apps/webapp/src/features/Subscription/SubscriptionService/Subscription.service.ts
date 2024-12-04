import {
  PocketBaseCollection,
  type TCategory,
  type TCreateSubscriptionPayload,
  type TSubscription,
  type TUpdateSubscriptionPayload,
  ZSubscription,
} from '@budgetbuddyde/types';
import {type RecordModel} from 'pocketbase';
import {z} from 'zod';

import {pb} from '@/pocketbase';

export class SubscriptionService {
  /**
   * Retrieves a list of upcoming subscriptions.
   *
   * @param subscriptions - An array of subscription objects.
   * @param count - The number of upcoming subscriptions to retrieve.
   * @param offset - The starting index from which to retrieve subscriptions. Defaults to 0.
   * @returns An array of upcoming subscriptions, filtered to exclude paused subscriptions.
   */
  static getUpcomingSubscriptions(subscriptions: TSubscription[], count: number, offset: number = 0): TSubscription[] {
    return subscriptions.filter(({paused}) => !paused).slice(offset, offset + count);
  }

  /**
   * Retrieves upcoming subscription payments grouped by category.
   *
   * @param subscriptions - An array of subscription objects.
   * @returns A Map where the key is the category ID and the value is an object containing the category and the total amount of upcoming payments.
   *
   * The function filters the subscriptions to include only those that are not paused, have an execution date later than today, and have a negative transfer amount.
   * It then groups the filtered subscriptions by category and calculates the total amount for each category.
   */
  static getUpcomingSubscriptionPaymentsByCategory(
    subscriptions: TSubscription[],
  ): Map<TCategory['id'], {category: TCategory; total: number}> {
    const today = new Date().getDate();
    const grouped = new Map<TCategory['id'], {category: TCategory; total: number}>();
    subscriptions = subscriptions.filter(
      ({paused, execute_at, transfer_amount}) => !paused && execute_at > today && transfer_amount < 0,
    );

    for (const {
      expand: {category},
      transfer_amount,
    } of subscriptions) {
      const amount = Math.abs(transfer_amount);
      if (grouped.has(category.id)) {
        const curr = grouped.get(category.id);
        grouped.set(category.id, {category: category, total: curr!.total + amount});
      } else grouped.set(category.id, {category: category, total: amount});
    }

    return grouped;
  }

  /**
   * Creates a new subscription record.
   *
   * @param payload - The payload containing the subscription data.
   * @returns A promise that resolves to the created subscription record.
   */
  static async createSubscription(payload: TCreateSubscriptionPayload): Promise<RecordModel> {
    const record = await pb.collection(PocketBaseCollection.SUBSCRIPTION).create(payload, {requestKey: null});
    return record;
  }

  /**
   * Updates a subscription with the specified ID using the provided payload.
   * @param subscriptionId - The ID of the subscription to update.
   * @param payload - The payload containing the updated subscription data.
   * @returns A Promise that resolves to the updated record.
   */
  static async updateSubscription(
    subscriptionId: TSubscription['id'],
    payload: TUpdateSubscriptionPayload,
  ): Promise<RecordModel> {
    const record = await pb.collection(PocketBaseCollection.SUBSCRIPTION).update(subscriptionId, payload);
    return record;
  }

  /**
   * Retrieves a list of subscriptions.
   * @returns A promise that resolves to an array of TSubscription objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getSubscriptions(): Promise<TSubscription[]> {
    const records = await pb.collection(PocketBaseCollection.SUBSCRIPTION).getFullList({
      expand: 'category,payment_method',
    });

    const parsingResult = z.array(ZSubscription).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Sorts an array of subscriptions based on their execution date.
   * Paid subscriptions are moved to the end, unpaid subscriptions are kept at the beginning,
   * and the rest are sorted by their execution date.
   *
   * @param subscriptions - The array of subscriptions to be sorted.
   * @returns The sorted array of subscriptions.
   */
  static sortByExecutionDate(subscriptions: TSubscription[]): TSubscription[] {
    const today = new Date().getDate();
    return subscriptions.sort((a, b) => {
      if (a.execute_at <= today && b.execute_at > today) {
        return 1; // Move already paid subscriptions to the end
      } else if (a.execute_at > today && b.execute_at <= today) {
        return -1; // Keep unpaid subscriptions at the beginning
      } else {
        return a.execute_at - b.execute_at; // Sort by executeAt for the rest
      }
    });
  }

  /**
   * Retrieves the planned balance by type from a list of subscriptions.
   * @param subscriptions - The list of subscriptions to filter.
   * @param type - The type of subscription to filter by. Defaults to 'INCOME'.
   * @returns The filtered and sorted list of subscriptions.
   */
  static getPlannedBalanceByType(
    subscriptions: TSubscription[],
    type: 'INCOME' | 'SPENDINGS' = 'INCOME',
  ): TSubscription[] {
    return this.sortByExecutionDate(
      subscriptions.filter(({transfer_amount}) => (type === 'INCOME' ? transfer_amount > 0 : transfer_amount < 0)),
    );
  }

  /**
   * Calculates the total upcoming transfer amount for a given data type ('INCOME' or 'EXPENSES') and a list of subscriptions.
   *
   * @param data - The data type to filter the subscriptions ('INCOME' or 'EXPENSES').
   * @param subscriptions - The list of subscriptions to calculate the total upcoming transfer amount.
   * @returns The total upcoming transfer amount for the specified data type and subscriptions.
   */
  static getUpcomingX(data: 'INCOME' | 'EXPENSES', subscriptions: TSubscription[]) {
    const today = new Date().getDate();
    return subscriptions
      .filter(({paused}) => !paused)
      .reduce((acc, {transfer_amount, execute_at}) => {
        if ((data === 'INCOME' && transfer_amount > 0) || (data === 'EXPENSES' && transfer_amount < 0)) {
          return execute_at > today ? acc + Math.abs(transfer_amount) : acc;
        }
        return acc;
      }, 0);
  }
}
