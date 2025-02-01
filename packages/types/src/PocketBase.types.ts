import {z} from 'zod';
import {ZDate} from './Base.type';

export enum PocketBaseCollection {
  USERS = 'users',
  BUDGET = 'budgets',
  CATEGORY = 'categories',
  PAYMENT_METHOD = 'payment_methods',
  STOCK_EXCHANGE = 'stock_exchanges',
  STOCK_POSITION = 'stock_positions',
  STOCK_WATCHLIST = 'stock_watchlists',
  SUBSCRIPTION = 'subscriptions',
  TRANSACTION = 'transactions',
  NEWSLETTER = 'newsletters',
  V_MONTHLY_BALANCES = 'v_monthly_balances',
  V_BUDGET_PROGRESS = 'v_budget_progress',
}

/**
 * @description	15 characters string to store as record ID. If not set, it will be auto generated.
 */
export const ZId = z.string().length(15);
export type TId = z.infer<typeof ZId>;

export const ZBaseModel = z.object({
  collectionId: ZId,
  collectionName: z.string(),
  id: ZId,
  created: ZDate,
  updated: ZDate,
});
export type TBaseModel = z.infer<typeof ZBaseModel>;

export const ZNullableString = z
  .string()
  .nullable()
  .optional()
  .transform(v => (typeof v === 'string' && v.length > 0 ? v : null));
export type TNullableString = z.infer<typeof ZNullableString>;
