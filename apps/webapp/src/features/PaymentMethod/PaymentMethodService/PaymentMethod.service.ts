import {
  PocketBaseCollection,
  type TCreatePaymentMethodPayload,
  type TPaymentMethod,
  type TTransaction,
  type TUpdatePaymentMethodPayload,
  ZPaymentMethod,
} from '@budgetbuddyde/types';
import {subDays} from 'date-fns';
import {RecordModel} from 'pocketbase';
import {z} from 'zod';

import {pb} from '@/pocketbase';

import {type TPaymentMethodAutocompleteOption} from '../Autocomplete';

export class PaymentMethodService {
  private static paymentMethodLabelSeperator = '•';

  /**
   * Creates a new payment method.
   *
   * @param payload - The payload containing the details of the payment method.
   * @returns A Promise that resolves to the created payment method record.
   */
  static async createPaymentMethod(payload: TCreatePaymentMethodPayload): Promise<RecordModel> {
    const record = await pb.collection(PocketBaseCollection.PAYMENT_METHOD).create(payload, {requestKey: null});
    return record;
  }

  /**
   * Updates a payment method with the specified ID using the provided payload.
   * @param paymentMethodId - The ID of the payment method to update.
   * @param payload - The payload containing the updated payment method data.
   * @returns A Promise that resolves to the updated payment method record.
   */
  static async updatePaymentMethod(
    paymentMethodId: TPaymentMethod['id'],
    payload: TUpdatePaymentMethodPayload,
  ): Promise<RecordModel> {
    const record = await pb.collection(PocketBaseCollection.PAYMENT_METHOD).update(paymentMethodId, payload);
    return record;
  }

  /**
   * Retrieves the list of payment methods.
   * @returns A promise that resolves to an array of payment methods.
   * @throws If there is an error parsing the payment methods.
   */
  static async getPaymentMethods(): Promise<TPaymentMethod[]> {
    const records = await pb.collection(PocketBaseCollection.PAYMENT_METHOD).getFullList();

    const parsingResult = z.array(ZPaymentMethod).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Deletes a payment method with the specified ID.
   *
   * @param paymentMethodId - The ID of the payment method to delete.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  static async deletePaymentMethod(paymentMethodId: TPaymentMethod['id']): Promise<boolean> {
    const record = await pb.collection(PocketBaseCollection.PAYMENT_METHOD).delete(paymentMethodId);
    return record;
  }

  /**
   * Sorts the autocomplete options for payment-methods based on transaction usage.
   *
   * @param transactions - The list of transactions.
   * @param days - The number of days to consider for transaction usage. Default is 30 days.
   * @returns The sorted autocomplete options for payment-methods.
   */
  static sortAutocompleteOptionsByTransactionUsage(
    paymentMethods: TPaymentMethod[],
    transactions: TTransaction[],
    days: number = 30,
  ): TPaymentMethodAutocompleteOption[] {
    const uniquePaymentMethods = paymentMethods;
    const now = new Date();
    const startDate = subDays(now, days);
    const paymentMethodFrequencyMap: {[paymentMethodId: string]: number} = {};

    let pastNTransactions = transactions.filter(({processed_at}) => processed_at >= startDate);
    if (pastNTransactions.length < 1) pastNTransactions = transactions.slice(0, 50);
    pastNTransactions.forEach(
      ({
        expand: {
          payment_method: {id},
        },
        processed_at,
      }) => {
        if (processed_at >= startDate && processed_at <= now) {
          paymentMethodFrequencyMap[id] = (paymentMethodFrequencyMap[id] || 0) + 1;
        }
      },
    );

    return uniquePaymentMethods
      .map(paymentMethod => ({
        ...paymentMethod,
        frequency: paymentMethodFrequencyMap[paymentMethod.id] || -1,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .map(({id, name, provider}) => ({
        label: this.getAutocompleteLabel({name, provider}),
        id: id,
      }));
  }

  /**
   * Returns the autocomplete label for a payment method.
   * The autocomplete label is a combination of the payment method's name and provider.
   * @param paymentMethod - The payment method object.
   * @returns The autocomplete label.
   */
  static getAutocompleteLabel(paymentMethod: Pick<TPaymentMethod, 'name' | 'provider'>): string {
    return `${paymentMethod.name} ${this.paymentMethodLabelSeperator} ${paymentMethod.provider}`;
  }

  /**
   * Filters an array of payment methods based on a keyword.
   * @param paymentMethods - The array of payment methods to filter.
   * @param keyword - The keyword to filter by.
   * @returns The filtered array of payment methods.
   */
  static filter(paymentMethods: TPaymentMethod[], keyword: string): TPaymentMethod[] {
    const lowerKeyword = keyword.toLowerCase();
    return paymentMethods.filter(
      ({name, provider, description}) =>
        name.toLowerCase().includes(lowerKeyword) ||
        provider?.toLowerCase().includes(lowerKeyword) ||
        description?.toLowerCase().includes(lowerKeyword),
    );
  }
}
