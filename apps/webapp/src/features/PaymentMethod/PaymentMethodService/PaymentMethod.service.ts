import {type TPaymentMethod, type TTransaction} from '@budgetbuddyde/types';
import {subDays} from 'date-fns';
import {z} from 'zod';

import {
  PaymentMethod,
  PaymentMethodResponse,
  PaymentMethod_VH,
  type TCreateOrUpdatePaymentMethod,
  type TPaymentMethodResponse,
  type TPaymentMethod_VH,
  type TPaymentMethod as _TPaymentMethod,
} from '@/newTypes';
import {EntityService} from '@/services/Entity';

import {type TPaymentMethodAutocompleteOption} from '../Autocomplete';

export class PaymentMethodService extends EntityService {
  private static readonly $entityPath = this.$servicePath + '/PaymentMethod';
  private static readonly $valueHelpPath = this.$servicePath + '/PaymentMethod_VH';

  private static paymentMethodLabelSeperator = '•';

  /**
   * Creates a new payment method.
   *
   * @param payload - The payload containing the details of the payment method.
   * @returns A Promise that resolves to the created payment method record.
   */
  static async createPaymentMethod(payload: TCreateOrUpdatePaymentMethod): Promise<TPaymentMethodResponse> {
    const record = await this.$odata.post(this.$entityPath, payload).query();
    const parsingResult = PaymentMethodResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Updates a payment method with the specified ID using the provided payload.
   * @param paymentMethodId - The ID of the payment method to update.
   * @param payload - The payload containing the updated payment method data.
   * @returns A Promise that resolves to the updated payment method record.
   */
  static async updatePaymentMethod(
    paymentMethodId: _TPaymentMethod['ID'],
    payload: TCreateOrUpdatePaymentMethod,
  ): Promise<TPaymentMethodResponse> {
    const record = await this.$odata.put(`${this.$entityPath}(ID=${paymentMethodId})`, payload).query();
    const parsingResult = PaymentMethodResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Deletes a payment method with the specified ID.
   *
   * @param paymentMethodId - The ID of the payment method to delete.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  static async deletePaymentMethod(paymentMethodId: _TPaymentMethod['ID']): Promise<boolean> {
    const response = (await this.$odata.delete(`${this.$entityPath}(ID=${paymentMethodId})`).query()) as Response;
    if (!response.ok) {
      console.warn('Failed to delete payment method:', response.body);
      return false;
    }
    return true;
  }

  /**
   * Retrieves the list of payment-methods from the database.
   * @returns A promise that resolves to an array of TPaymentMethod objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getPaymentMethods(): Promise<_TPaymentMethod[]> {
    const records = await this.$odata.get(this.$entityPath).query();
    const parsingResult = z.array(PaymentMethod).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Retrieves the list of payment-methods from the database.
   * @returns A promise that resolves to an array of TPaymentMethod objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getPaymentMethodValueHelps(): Promise<TPaymentMethod_VH[]> {
    const records = await this.$odata.get(this.$valueHelpPath).query();
    const parsingResult = z.array(PaymentMethod_VH).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
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
        name: this.getAutocompleteLabel({name, provider}),
        ID: id,
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
