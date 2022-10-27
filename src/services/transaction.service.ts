import { isSameMonth } from 'date-fns';
import { supabase } from '../supabase';
import type { IBaseTransaction, IExportTransaction, ITransaction } from '../types/transaction.type';
import type { TExportType } from '../components/user-profile.component';
import { BaseTransaction, Transaction } from '../models/transaction.model';

export class TransactionService {
  private static table = 'transactions';

  static async createTransactions(
    transactions: Partial<IBaseTransaction>[]
  ): Promise<BaseTransaction[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<IBaseTransaction>(this.table)
        .insert(transactions);
      if (error) rej(error);
      res(data ? data.map((transaction) => new BaseTransaction(transaction)) : []);
    });
  }

  static async getTransactions(): Promise<Transaction[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<ITransaction>(this.table)
        .select(
          `
          id,
          amount,
          receiver,
          description, 
          date,
          created_by,
          updated_at,
          inserted_at,
          paymentMethods (
            id, name, address, provider, description
          ),
          categories (
            id, name, description
          )`
        )
        .order('date', { ascending: false });
      if (error) rej(error);
      res(data ? data.map((transaction) => new Transaction(transaction)) : []);
    });
  }

  static async updateTransaction(
    id: number,
    updatedTransaction: Partial<IBaseTransaction>
  ): Promise<BaseTransaction[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<IBaseTransaction>(this.table)
        .update(updatedTransaction)
        .match({ id: id });
      if (error) rej(error);
      res(data ? data.map((transaction) => new BaseTransaction(transaction)) : []);
    });
  }

  static async deleteTransactionById(id: number): Promise<BaseTransaction[]> {
    return new Promise(async (res, rej) => {
      const { data, error } = await supabase
        .from<IBaseTransaction>(this.table)
        .delete()
        .match({ id: id });
      if (error) rej(error);
      res(data ? data.map((transaction) => new BaseTransaction(transaction)) : []);
    });
  }

  /**
   * Get all income for the month which the user have received
   */
  static getCurrentMonthIncome(transactions: Transaction[]) {
    const now = new Date();
    return Math.abs(
      transactions
        .filter(
          (transaction) =>
            isSameMonth(new Date(transaction.date), now) &&
            new Date(transaction.date) <= now &&
            transaction.amount > 0
        )
        .reduce((prev, cur) => prev + cur.amount, 0)
    );
  }

  /**
   * Get income for this month which hasn't been processed  till today
   */
  static getFutureIncome(transactions: Transaction[]) {
    const now = new Date();
    return Math.abs(
      transactions
        .filter(
          (transaction) =>
            isSameMonth(new Date(transaction.date), now) &&
            new Date(transaction.date) > now &&
            transaction.amount > 0
        )
        .reduce((prev, cur) => prev + cur.amount, 0)
    );
  }

  /**
   * Get all spendings for the month which the user have fullfilled
   */
  static getCurrentMonthSpendings(transactions: Transaction[]) {
    const now = new Date();
    return Math.abs(
      transactions
        .filter(
          (transaction) =>
            isSameMonth(new Date(transaction.date), now) &&
            new Date(transaction.date) <= now &&
            transaction.amount < 0
        )
        .reduce((prev, cur) => prev + cur.amount, 0)
    );
  }

  /**
   * Get spendings for this month which hasn't been processed till today
   */
  static getFutureSpendings(transactions: Transaction[]) {
    const now = new Date();
    return Math.abs(
      transactions
        .filter(
          (transaction) =>
            isSameMonth(new Date(transaction.date), now) &&
            new Date(transaction.date) > now &&
            transaction.amount < 0
        )
        .reduce((prev, cur) => prev + cur.amount, 0)
    );
  }

  /**
   * Get the transactions, ready for the export
   */
  static export(type: TExportType = 'json'): Promise<IExportTransaction[] | string> {
    return new Promise((res, rej) => {
      switch (type) {
        case 'json':
          supabase
            .from(`transactions`)
            .select(`*, categories:category(*), paymentMethods:paymentMethod(*)`)
            .then((result) => {
              if (result.error) rej(result.error);
              // @ts-ignore
              res(result.data ?? []);
            });
          break;

        case 'csv':
          supabase
            .from(`transactions`)
            .select(`*, categories:category(*), paymentMethods:paymentMethod(*)`)
            .csv()
            .then((result) => {
              if (result.error) rej(result.error);
              res((result.data as string) ?? '');
            });
          break;
      }
    });
  }
}
