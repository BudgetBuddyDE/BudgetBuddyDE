import {type TCategory, type TSubscription} from '@budgetbuddyde/types';
import {o} from '@tklein1801/o.js';
import {z} from 'zod';

import {
  ExpandedSubscription,
  SubscriptionResponse,
  type TCreateOrUpdateSubscription,
  type TExpandedSubscription,
  type TSubscriptionResponse,
  type TSubscription as _TSubscription,
} from '@/newTypes';

export class SubscriptionService {
  private static readonly $servicePath = '/odata/v4/backend';
  private static readonly $entityPath = this.$servicePath + '/Subscription';
  private static readonly $odata = o(import.meta.env.VITE_BACKEND_HOST, {
    // TODO: Configure the $batch endpoint
    credentials: 'include',
  });

  /**
   * Creates a new subscription.
   * @param payload - The payload containing the data for the new subscription.
   * @returns A promise that resolves to the created subscription record.
   */
  static async createSubscription(payload: TCreateOrUpdateSubscription): Promise<TSubscriptionResponse> {
    const record = await this.$odata.post(this.$entityPath, payload).query();
    const parsingResult = SubscriptionResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Updates a subscription with the specified ID using the provided payload.
   * @param subscriptionId - The ID of the subscription to update.
   * @param payload - The payload containing the updated subscription data.
   * @returns A Promise that resolves to the updated subscription record.
   */
  static async updateSubscription(
    subscriptionId: _TSubscription['ID'],
    payload: Partial<TCreateOrUpdateSubscription>,
  ): Promise<TSubscriptionResponse> {
    const record = await this.$odata.put(`${this.$entityPath}(ID=${subscriptionId})`, payload).query();
    const parsingResult = SubscriptionResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Deletes a subscription with the specified ID.
   * @param subscriptionId - The ID of the subscription to delete.
   * @throws If the deletion fails, it logs a warning and returns false.
   * @description Deletes a subscription with the specified ID.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  static async deleteSubscription(subscriptionId: _TSubscription['ID']): Promise<boolean> {
    const response = (await this.$odata.delete(`${this.$entityPath}(ID=${subscriptionId})`).query()) as Response;
    if (!response.ok) {
      console.warn('Failed to delete subscription:', response.body);
      return false;
    }
    return true;
  }

  /**
   * Retrieves the list of subscriptions from the database.
   * @returns A promise that resolves to an array of TSubscription objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getSubscriptions(): Promise<TExpandedSubscription[]> {
    const records = await this.$odata.get(this.$entityPath).query({
      $expand: 'toCategory,toPaymentMethod',
    });
    const parsingResult = z.array(ExpandedSubscription).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

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
