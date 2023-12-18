import { z } from 'zod';
import {
  ZTransaction,
  type EDailyTransactionType,
  type TApiResponse,
  type TCreateTransactionPayload,
  type TDailyTransaction,
  type TDeleteTransactionPayload,
  type TTransaction,
  type TUpdateTransactionPayload,
  ZDailyTransaction,
} from '@/types';
import { format, isSameMonth } from 'date-fns';
import { isRunningInProdEnv, prepareRequestOptions } from '@/utils';
import { type IAuthContext } from '../Auth';
import { TDashboardStats } from '@/components/DashboardStatsWrapper.component';

export class TransactionService {
  private static host =
    (isRunningInProdEnv() ? (process.env.BACKEND_HOST as string) : '/api') + '/v1/transaction';

  static async getTransactionsByUuid({
    uuid,
    password,
  }: IAuthContext['authOptions']): Promise<[TTransaction[] | null, Error | null]> {
    try {
      const query = new URLSearchParams();
      query.append('uuid', uuid);
      const response = await fetch(this.host + '?' + query.toString(), {
        ...prepareRequestOptions({ uuid, password }),
      });
      const json = (await response.json()) as TApiResponse<TTransaction[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZTransaction).safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static async getDailyTransactions(
    startDate: Date,
    endDate: Date,
    requestedData: EDailyTransactionType,
    user: IAuthContext['authOptions']
  ): Promise<[TDailyTransaction[] | null, Error | null]> {
    try {
      const query = new URLSearchParams();
      query.append('startDate', format(startDate, 'yyyy-MM-dd'));
      query.append('endDate', format(endDate, 'yyyy-MM-dd'));
      query.append('requestedData', requestedData.toString());
      const response = await fetch(this.host + '/daily?' + query.toString(), {
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TDailyTransaction[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZDailyTransaction).safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static async getDashboardStats(
    user: IAuthContext['authOptions']
  ): Promise<[TDashboardStats | null, Error | null]> {
    try {
      const response = await fetch(this.host + '/stats', {
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TDashboardStats>;
      if (json.status != 200) return [null, new Error(json.message!)];
      return [json.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static getUniqueReceivers(transactions: TTransaction[]): string[] {
    return [...new Set(transactions.map(({ receiver }) => receiver))];
  }

  static async create(
    transaction: TCreateTransactionPayload[],
    user: IAuthContext['authOptions']
  ): Promise<[TTransaction[] | null, Error | null]> {
    try {
      const response = await fetch(this.host, {
        method: 'POST',
        body: JSON.stringify(transaction),
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TTransaction[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZTransaction).safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static async update(
    transaction: TUpdateTransactionPayload,
    user: IAuthContext['authOptions']
  ): Promise<[TTransaction | null, Error | null]> {
    try {
      const response = await fetch(this.host, {
        method: 'PUT',
        body: JSON.stringify(transaction),
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TTransaction>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZTransaction.safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static async delete(
    transaction: TDeleteTransactionPayload,
    user: IAuthContext['authOptions']
  ): Promise<[TTransaction | null, Error | null]> {
    try {
      const response = await fetch(this.host, {
        method: 'DELETE',
        body: JSON.stringify(transaction),
        ...prepareRequestOptions(user),
      });
      const json = (await response.json()) as TApiResponse<TTransaction>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZTransaction.safeParse(json.data);
      if (!parsingResult.success) throw new Error(parsingResult.error.message);
      return [parsingResult.data, null];
    } catch (error) {
      console.error(error);
      return [null, error as Error];
    }
  }

  static calculateReceivedEarnings(transactions: TTransaction[]): number {
    const now = new Date();
    const num = transactions
      .filter(
        ({ transferAmount, processedAt }) =>
          transferAmount > 0 && processedAt <= now && isSameMonth(processedAt, now)
      )
      .reduce((prev, cur) => prev + cur.transferAmount, 0);
    return Number(num.toFixed(2));
  }

  static calculateUpcomingEarnings(transactions: TTransaction[]): number {
    const now = new Date();
    const num = transactions
      .filter(
        ({ processedAt, transferAmount }) =>
          isSameMonth(processedAt, now) && processedAt > now && transferAmount > 0
      )
      .reduce((prev, cur) => prev + cur.transferAmount, 0);
    return Number(num.toFixed(2));
  }
}
