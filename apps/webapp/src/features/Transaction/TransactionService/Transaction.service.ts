import {PocketBaseCollection, type TTransaction} from '@budgetbuddyde/types';
import {isAfter, isSameMonth, subDays} from 'date-fns';
import {type RecordModel} from 'pocketbase';
import {z} from 'zod';

import {
  ExpandedTransasction,
  MonthlyKPIResponse,
  type TCreateOrUpdateTransaction,
  type TExpandedTransaction,
  TMonthlyKPIResponse,
  type TTransactionResponse,
  TransactionResponse,
} from '@/newTypes';
import {type TTransaction as _TTransaction} from '@/newTypes';
import {pb} from '@/pocketbase';
import {EntityService} from '@/services/Entity';

/**
 * Service for managing transactions.
 */
/**
 * Service class for managing transactions.
 */
export class TransactionService extends EntityService {
  private static readonly $entityPath = this.$servicePath + '/Transaction';

  /**
   * Creates a new transaction.
   * @param payload - The payload containing the data for the new transaction.
   * @returns A promise that resolves to the created transaction record.
   */
  static async createTransaction(payload: TCreateOrUpdateTransaction): Promise<TTransactionResponse> {
    const record = await this.$odata.post(this.$entityPath, payload).query();
    const parsingResult = TransactionResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Updates a transaction with the specified ID using the provided payload.
   * @param transactionId - The ID of the transaction to update.
   * @param payload - The payload containing the updated transaction data.
   * @returns A Promise that resolves to the updated transaction record.
   */
  static async updateTransaction(
    transactionId: _TTransaction['ID'],
    payload: TCreateOrUpdateTransaction,
  ): Promise<TTransactionResponse> {
    const record = await this.$odata.patch(`${this.$entityPath}(ID=${transactionId})`, payload).query();
    const parsingResult = TransactionResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Deletes a transaction with the specified ID.
   * @param transactionId - The ID of the transaction to delete.
   * @throws If the deletion fails, it logs a warning and returns false.
   * @description Deletes a transaction with the specified ID.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  static async deleteTransaction(transactionId: _TTransaction['ID']): Promise<boolean> {
    const response = (await this.$odata.delete(`${this.$entityPath}(ID=${transactionId})`).query()) as Response;
    if (!response.ok) {
      console.warn('Failed to delete transaction:', response.body);
      return false;
    }
    return true;
  }

  /**
   * Retrieves the list of transactions from the database.
   * @returns A promise that resolves to an array of TTransaction objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getTransactions(): Promise<TExpandedTransaction[]> {
    const records = await this.$odata.get(this.$entityPath).query({
      $expand: 'toCategory,toPaymentMethod',
    });
    const parsingResult = z.array(ExpandedTransasction).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Retrieves the monthly KPIs from the database.
   * @returns A promise that resolves to a TMonthlyKPIResponse object containing the monthly KPIs.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getMonthlyKPIs(): Promise<TMonthlyKPIResponse> {
    const records = await this.$odata.get(this.$servicePath + '/MonthlyKPI').query();
    const parsingResult = MonthlyKPIResponse.safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Retrieves the latest transactions up to a specified count, starting from a given offset.
   * Filters out transactions that have not been processed yet.
   *
   * @param transactions - An array of transactions to filter and slice.
   * @param count - The number of latest transactions to retrieve.
   * @param offset - The starting index from which to retrieve transactions. Defaults to 0.
   * @returns An array of the latest transactions up to the specified count, starting from the given offset.
   */
  static getLatestTransactions(transactions: TTransaction[], count: number, offset: number = 0): TTransaction[] {
    const now = new Date();
    return transactions.filter(({processed_at}) => processed_at <= now).slice(offset, offset + count) ?? [];
  }

  /**
   * Filters and returns the list of transactions that have been processed and have a negative transfer amount (indicating an expense).
   *
   * @param transactions - An array of transactions to filter.
   * @returns An array of transactions that have been processed and are expenses.
   */
  static getPaidExpenses(transactions: TTransaction[]): TTransaction[] {
    const now = new Date();
    return transactions.filter(t => t.processed_at <= now && t.transfer_amount < 0);
  }

  /**
   * Deletes the specified images from a transaction.
   *
   * @param transactionId - The ID of the transaction.
   * @param imageIds - An array of image IDs to be deleted.
   * @returns A Promise that resolves to a RecordModel object representing the updated transaction record.
   */
  static async deleteImages(transactionId: TTransaction['id'], imageIds: string[]): Promise<RecordModel> {
    return await pb.collection(PocketBaseCollection.TRANSACTION).update(transactionId, {'attachments-': imageIds});
  }

  /**
   * Returns an array of unique receivers from the given transactions within a specified number of days.
   * The receivers are sorted based on their frequency of occurrence in the transactions.
   *
   * @param transactions - The array of transactions.
   * @param days - The number of days to consider for filtering the transactions. Default is 30 days.
   * @returns An array of unique receivers sorted by frequency of occurrence.
   */
  static getUniqueReceivers(transactions: TTransaction[], days: number = 30): string[] {
    const uniqueReceivers = Array.from(new Set(transactions.map(({receiver}) => receiver)));
    const now = new Date();
    const startDate = subDays(now, days);
    const receiverFrequencyMap: {[receiver: string]: number} = {};

    let pastNTransactions = transactions.filter(({processed_at}) => processed_at >= startDate);
    if (pastNTransactions.length < 1) pastNTransactions = transactions.slice(0, 50);
    pastNTransactions.forEach(({receiver, processed_at}) => {
      if (processed_at >= startDate && processed_at <= now) {
        receiverFrequencyMap[receiver] = (receiverFrequencyMap[receiver] || 0) + 1;
      }
    });

    return uniqueReceivers
      .map(receiver => ({
        receiver,
        frequency: receiverFrequencyMap[receiver] || -1,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .map(({receiver}) => receiver);
  }

  /**
   * Calculates the total received earnings from a list of transactions.
   * Only transactions with a positive transfer amount and processed within the current month are considered
   * @param transactions - The list of transactions to calculate the earnings from.
   * @returns The total received earnings.
   */
  static getReceivedIncome(transactions: TTransaction[]): number {
    const now = new Date();
    return transactions
      .filter(
        ({transfer_amount, processed_at}) =>
          transfer_amount > 0 && processed_at <= now && isSameMonth(processed_at, now),
      )
      .reduce((prev, cur) => prev + cur.transfer_amount, 0);
  }

  /**
   * Calculates the total upcoming income or expenses from a list of transactions.
   * Only transactions that have a future processed date are considered.
   *
   * @param data - The type of data to calculate: 'INCOME' or 'EXPENSES'.
   * @param transactions - The list of transactions to calculate the upcoming income or expenses from.
   * @returns The total upcoming income or expenses.
   */
  static getUpcomingX(data: 'INCOME' | 'EXPENSES', transactions: TTransaction[]): number {
    const today = new Date();
    return transactions.reduce((acc, {transfer_amount, processed_at}) => {
      if (
        ((data === 'INCOME' && transfer_amount > 0) || (data === 'EXPENSES' && transfer_amount < 0)) &&
        isSameMonth(processed_at, today) &&
        isAfter(processed_at, today)
      ) {
        return processed_at > today ? acc + transfer_amount : acc;
      }
      return acc;
    }, 0);
  }
}
