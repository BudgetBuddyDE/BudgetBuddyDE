import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';

export function summarizeYear(history: THistoricalBalance[], year: number) {
  const byMonth = new Map(history.map(row => [new Date(row.date).getMonth(), row]));
  return Array.from({length: 12}, (_, month) => {
    const row = byMonth.get(month);
    return {month, income: row?.income ?? 0, expenses: row?.expenses ?? 0, balance: row?.balance ?? 0, year};
  });
}

export function summarizePeriodCategories(history: THistoricalCategoryBalance[], period: string) {
  const [year, month] = period.split('-').map(Number);
  const totals = new Map<string, {id: string; name: string; income: number; expenses: number}>();
  for (const row of history) {
    const date = new Date(row.date);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month) continue;
    const current = totals.get(row.category.id) ?? {
      id: row.category.id,
      name: row.category.name,
      income: 0,
      expenses: 0,
    };
    current.income += row.income;
    current.expenses += row.expenses;
    totals.set(row.category.id, current);
  }
  return [...totals.values()].sort((left, right) => right.expenses - left.expenses);
}

export function plannedRecurringExpenses(items: TExpandedRecurringPayment[], period: string): number {
  const [year, month] = period.split('-').map(Number);
  const targetIndex = year * 12 + month - 1;
  return items.reduce((total, item) => {
    if (item.paused || item.transferAmount >= 0) return total;
    const anchor = new Date(item.nextExecutionAt);
    const anchorIndex = anchor.getFullYear() * 12 + anchor.getMonth();
    const interval = item.interval === 'monthly' ? 1 : item.interval === 'quarterly' ? 3 : 12;
    return (targetIndex - anchorIndex) % interval === 0 ? total + Math.abs(item.transferAmount) : total;
  }, 0);
}
