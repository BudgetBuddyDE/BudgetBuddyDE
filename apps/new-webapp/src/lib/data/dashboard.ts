import type {TBudget} from '@budgetbuddyde/api/budget';
import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';
import {toDateInputValue} from '@/utils/date';

export interface DashboardData {
  history: THistoricalBalance[];
  categoryHistory: THistoricalCategoryBalance[];
  recentTransactions: TExpandedTransaction[];
  budgets: TBudget[];
  upcoming: TExpandedRecurringPayment[];
  error?: string;
}

export async function loadDashboard(period: string): Promise<DashboardData> {
  const headers = await getForwardedHeaders();
  const dateFrom = `${period}-01`;
  const [year, month] = period.split('-').map(Number);
  const dateTo = toDateInputValue(new Date(year, month, 0));
  const config = {headers, cache: 'no-store' as const};
  const [history, categoryHistory, transactions, budgets, recurring] = await Promise.all([
    apiClient.backend.insights.getHistoricalBalance(
      {$dateFrom: new Date(`${dateFrom}T00:00:00`), $dateTo: new Date(`${dateTo}T00:00:00`)},
      config,
    ),
    apiClient.backend.insights.getHistoricalCategoryBalance(
      {$dateFrom: new Date(`${dateFrom}T00:00:00`), $dateTo: new Date(`${dateTo}T00:00:00`)},
      config,
    ),
    apiClient.backend.transaction.getAll(
      {
        from: 0,
        to: 5,
        order: 'desc',
        sort: 'date',
        $dateFrom: new Date(`${dateFrom}T00:00:00`),
        $dateTo: new Date(`${dateTo}T23:59:59`),
      },
      config,
    ),
    apiClient.backend.budget.getAll({from: 0, to: 100, $period: period}, config),
    apiClient.backend.recurringPayment.getAll({from: 0, to: 100}, config),
  ]);
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 31);
  return {
    history: history[0]?.data ?? [],
    categoryHistory: categoryHistory[0]?.data ?? [],
    recentTransactions: transactions[0]?.data ?? [],
    budgets: budgets[0]?.data ?? [],
    upcoming: (recurring[0]?.data ?? [])
      .filter(
        item => !item.paused && new Date(item.nextExecutionAt) >= now && new Date(item.nextExecutionAt) <= horizon,
      )
      .slice(0, 5),
    error:
      history[1] || categoryHistory[1] || transactions[1] || budgets[1] || recurring[1]
        ? 'Some dashboard data could not be loaded.'
        : undefined,
  };
}
