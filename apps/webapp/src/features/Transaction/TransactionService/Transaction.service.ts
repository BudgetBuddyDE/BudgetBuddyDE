import {
  PocketBaseCollection,
  type TCreateTransactionPayload,
  type TTransaction,
  ZTransaction,
} from '@budgetbuddyde/types';
import {format, isAfter, isSameMonth, subDays} from 'date-fns';
import {RecordFullListOptions, type RecordModel} from 'pocketbase';
import {z} from 'zod';

import {type TTransactionStoreFetchArgs} from '@/features/Transaction';
import {pb} from '@/pocketbase';

/**
 * Service for managing transactions.
 */
/**
 * Service class for managing transactions.
 */
export class TransactionService {
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
   * Creates a new transaction record.
   *
   * @param payload - The data for the transaction. Fields from TCreateTransactionPayload should be fullfilled.
   * @returns A promise that resolves to the created transaction record.
   */
  static async createTransaction(payload: FormData | TCreateTransactionPayload): Promise<RecordModel> {
    return await pb.collection(PocketBaseCollection.TRANSACTION).create(payload, {requestKey: null});
  }

  /**
   * Updates a transaction with the specified ID using the provided payload.
   * @param transactionId - The ID of the transaction to update.
   * @param payload - The data to update the transaction with.
   * @returns A Promise that resolves to the updated record.
   */
  static async updateTransaction(transactionId: TTransaction['id'], payload: FormData): Promise<RecordModel> {
    return await pb.collection(PocketBaseCollection.TRANSACTION).update(transactionId, payload);
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
   * Deletes a transaction with the specified ID.
   * @param transactionId - The ID of the transaction to delete.
   * @returns A promise that resolves to a boolean indicating whether the transaction was successfully deleted.
   */
  static async deleteTransaction(transactionId: TTransaction['id']): Promise<boolean> {
    return await pb.collection(PocketBaseCollection.TRANSACTION).delete(transactionId);
  }

  /**
   * Retrieves a list of transactions.
   * @returns A promise that resolves to an array of transactions.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getTransactions(args?: TTransactionStoreFetchArgs): Promise<TTransaction[]> {
    const filters = args
      ? pb.filter(`processed_at >= {:startDate} && processed_at <= {:endDate}`, {
          startDate: format(args.startDate, 'yyyy-MM-dd'),
          endDate: format(args.endDate, 'yyyy-MM-dd'),
        })
      : undefined;
    const expand = 'category,payment_method';
    const sort = '-processed_at';
    const options: RecordFullListOptions = filters ? {expand, sort, filter: filters} : {expand, sort};
    const records = await pb.collection(PocketBaseCollection.TRANSACTION).getFullList(options);

    const parsingResult = z.array(ZTransaction).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
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
