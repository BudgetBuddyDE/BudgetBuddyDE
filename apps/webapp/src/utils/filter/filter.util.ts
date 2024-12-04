import {type TSubscription, type TTransaction} from '@budgetbuddyde/types';
import {isSameDay} from 'date-fns';

import {type TFilters} from '@/components/Filter';

/**
 * Filters an array of transactions or subscriptions based on a keyword.
 * @param keyword - The keyword to filter by.
 * @param items - The array of transactions or subscriptions to filter.
 * @returns The filtered array of transactions or subscriptions.
 */
export function filterByKeyword(
  keyword: string | null,
  items: TTransaction[] | TSubscription[],
): TTransaction[] | TSubscription[] {
  if (!keyword || keyword.length == 0) return items;

  const lowerKeyword = keyword.toLowerCase();
  return items.filter(({receiver, expand, information}) => {
    return (
      receiver.toLowerCase().includes(lowerKeyword) ||
      expand.category.name.toLowerCase().includes(lowerKeyword) ||
      expand.payment_method.name.toLowerCase().includes(lowerKeyword) ||
      (information && information.toLowerCase().includes(lowerKeyword))
    );
  }) as TTransaction[] | TSubscription[];
}

/**
 * Filters transactions based on the provided keyword, filter options, and transaction list.
 * @param keyword - The keyword to filter transactions by.
 * @param filter - The filter options to apply.
 * @param transactions - The list of transactions to filter.
 * @returns The filtered list of transactions.
 */
export function filterTransactions(keyword: string, filter: TFilters, transactions: TTransaction[]): TTransaction[] {
  if (transactions.length === 0) return [];

  transactions = filterByKeyword(keyword, transactions) as TTransaction[];

  transactions = transactions.filter(
    ({processed_at}) => processed_at > filter.startDate || isSameDay(processed_at, filter.startDate),
  );

  transactions = transactions.filter(
    ({processed_at}) => processed_at < filter.endDate || isSameDay(processed_at, filter.endDate),
  );

  if (filter.categories != null && filter.categories.length > 0) {
    transactions = transactions.filter(({category}) => filter.categories?.includes(category));
  }

  if (filter.paymentMethods != null && filter.paymentMethods.length > 0) {
    transactions = transactions.filter(({payment_method}) => filter.paymentMethods?.includes(payment_method));
  }

  if (filter.priceFrom != null) {
    transactions = transactions.filter(({transfer_amount}) => transfer_amount >= filter.priceFrom!);
  }

  if (filter.priceTo != null) {
    transactions = transactions.filter(({transfer_amount}) => transfer_amount <= filter.priceTo!);
  }

  return transactions;
}

/**
 * Filters an array of subscriptions based on the provided keyword, filter options, and subscription data.
 * @param keyword - The keyword to filter the subscriptions by.
 * @param filter - The filter options to apply.
 * @param subscriptions - The array of subscriptions to filter.
 * @returns The filtered array of subscriptions.
 */
export function filterSubscriptions(
  keyword: string,
  filter: TFilters,
  subscriptions: TSubscription[],
): TSubscription[] {
  if (subscriptions.length === 0) return [];

  subscriptions = filterByKeyword(keyword, subscriptions) as TSubscription[];

  subscriptions = subscriptions.filter(({execute_at}) => execute_at >= filter.startDate.getDate());

  subscriptions = subscriptions.filter(({execute_at}) => execute_at <= filter.endDate.getDate());

  if (filter.categories != null && filter.categories.length > 0) {
    subscriptions = subscriptions.filter(({category}) => filter.categories?.includes(category));
  }

  if (filter.paymentMethods != null && filter.paymentMethods.length > 0) {
    subscriptions = subscriptions.filter(({payment_method}) => filter.paymentMethods?.includes(payment_method));
  }

  if (filter.priceFrom != null) {
    subscriptions = subscriptions.filter(({transfer_amount}) => transfer_amount >= filter.priceFrom!);
  }

  if (filter.priceTo != null) {
    subscriptions = subscriptions.filter(({transfer_amount}) => transfer_amount <= filter.priceTo!);
  }

  return subscriptions;
}
