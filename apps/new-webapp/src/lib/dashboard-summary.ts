import type {TBudget} from '@budgetbuddyde/api/budget';
import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';

export function summarizeBalance(history: THistoricalBalance[]) {
  const income = history.reduce((sum, row) => sum + row.income, 0);
  const expenses = history.reduce((sum, row) => sum + row.expenses, 0);
  return {
    income,
    expenses,
    balance: income - expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : null,
  };
}

export function summarizeCategories(history: THistoricalCategoryBalance[]) {
  const totals = new Map<string, {id: string; name: string; amount: number}>();
  for (const row of history) {
    const current = totals.get(row.category.id) ?? {id: row.category.id, name: row.category.name, amount: 0};
    current.amount += row.expenses;
    totals.set(row.category.id, current);
  }
  return [...totals.values()].filter(item => item.amount > 0).sort((left, right) => right.amount - left.amount);
}

export function summarizeBudgetHealth(budgets: TBudget[]) {
  return budgets.map(budget => ({
    id: budget.id,
    name: budget.name,
    percentage: budget.budget > 0 ? (Math.abs(budget.balance) / budget.budget) * 100 : 100,
    exceeded: Math.abs(budget.balance) > budget.budget,
  }));
}
