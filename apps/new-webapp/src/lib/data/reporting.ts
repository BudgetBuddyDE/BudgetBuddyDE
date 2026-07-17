import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';

export interface ReportingData {
  history: THistoricalBalance[];
  categoryHistory: THistoricalCategoryBalance[];
  recurring: TExpandedRecurringPayment[];
  error?: string;
}

export async function loadReportingYear(year: number): Promise<ReportingData> {
  const headers = await getForwardedHeaders();
  const query = {$dateFrom: new Date(year, 0, 1), $dateTo: new Date(year, 11, 31, 23, 59, 59)};
  const config = {headers, cache: 'no-store' as const};
  const [history, categories, recurring] = await Promise.all([
    apiClient.backend.insights.getHistoricalBalance(query, config),
    apiClient.backend.insights.getHistoricalCategoryBalance(query, config),
    apiClient.backend.recurringPayment.getAll({from: 0, to: 500}, config),
  ]);
  return {
    history: history[0]?.data ?? [],
    categoryHistory: categories[0]?.data ?? [],
    recurring: recurring[0]?.data ?? [],
    error: history[1] || categories[1] || recurring[1] ? 'Reporting data could not be loaded.' : undefined,
  };
}
