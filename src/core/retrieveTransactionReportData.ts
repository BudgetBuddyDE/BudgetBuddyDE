import {PocketBaseCollection, type TId, type TTransaction, type TUser} from '@budgetbuddyde/types';
import {format} from 'date-fns';

import {type WeeklyReportProps} from '../../transactional/emails/app/weekly-report';
import {logger} from '../logger';
import {pb} from '../pocketbase';

/**
 * Retrieves transaction report data for a given user within a specified date range.
 * @param user - The user for whom to retrieve the transaction report data.
 * @param startDate - The start date of the transaction report.
 * @param endDate - The end date of the transaction report.
 * @returns A promise that resolves to an object containing the transaction report data.
 */
export async function retrieveTransactionReportData(
  user: NonNullable<TUser>,
  startDate: Date,
  endDate: Date,
): Promise<Omit<WeeklyReportProps, 'name' | 'company' | 'startDate' | 'endDate'> & {user: NonNullable<TUser>}> {
  logger.debug(`Retrieving transaction report data within ${startDate} - ${endDate} for user ${user.id}`, {
    userId: user.id,
    startDate,
    endDate,
  });

  const userTransactions = await pb.collection<TTransaction>(PocketBaseCollection.TRANSACTION).getFullList({
    filter: `owner = "${user.id}" && created >= "${format(startDate, 'yyyy-MM-dd')}" && created <= "${format(endDate, 'yyyy-MM-dd')}"`,
    expand: 'category',
  });

  /// FIXME: Not working as expected
  const categoryGroupedTransactions = new Map<TId, TTransaction[]>();
  for (const transaction of userTransactions) {
    if (!categoryGroupedTransactions.has(transaction.category)) {
      categoryGroupedTransactions.set(transaction.category, [transaction]);
      continue;
    }

    const currEntry = categoryGroupedTransactions.get(transaction.category)!;
    categoryGroupedTransactions.set(transaction.category, [...currEntry, transaction]);
  }
  ///

  const categoryStats = Array.from(categoryGroupedTransactions.entries()).map(([_, transactions]) => {
    const expandedCategory = transactions[0].expand.category;
    let income = 0,
      spendings = 0;
    transactions.forEach(({transfer_amount}) =>
      transfer_amount > 0 ? (income += transfer_amount) : (spendings += Math.abs(transfer_amount)),
    );

    return {
      category: expandedCategory.name,
      income,
      spendings,
      balance: income - spendings,
    };
  });

  const totalIncome = categoryStats.reduce((acc, curr) => acc + curr.income, 0);
  const totalSpendings = categoryStats.reduce((acc, curr) => acc + curr.spendings, 0);
  const totalBalance = totalIncome - totalSpendings;
  return {
    user: user,
    income: totalIncome,
    spendings: totalSpendings,
    balance: totalBalance,
    grouped: categoryStats,
  };
}
