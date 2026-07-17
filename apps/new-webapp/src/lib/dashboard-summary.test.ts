import {describe, expect, it} from 'vitest';
import {summarizeBalance, summarizeBudgetHealth, summarizeCategories} from './dashboard-summary';

describe('dashboard summaries', () => {
  it('calculates financial KPIs and preserves no-income semantics', () => {
    expect(summarizeBalance([{income: 1000, expenses: 600, balance: 400}] as never)).toEqual({
      income: 1000,
      expenses: 600,
      balance: 400,
      savingsRate: 40,
    });
    expect(summarizeBalance([{income: 0, expenses: 10, balance: -10}] as never).savingsRate).toBeNull();
  });

  it('ranks expense categories independently of income', () => {
    const rows = [
      {category: {id: 'a', name: 'A'}, expenses: 10},
      {category: {id: 'b', name: 'B'}, expenses: 30},
      {category: {id: 'a', name: 'A'}, expenses: 5},
    ] as never;
    expect(summarizeCategories(rows).map(item => [item.name, item.amount])).toEqual([
      ['B', 30],
      ['A', 15],
    ]);
  });

  it('reports explicit zero budget and overrun health', () => {
    expect(
      summarizeBudgetHealth([
        {id: 'z', name: 'Zero', budget: 0, balance: 0},
        {id: 'o', name: 'Over', budget: 10, balance: 12},
      ] as never),
    ).toMatchObject([
      {percentage: 100, exceeded: false},
      {percentage: 120, exceeded: true},
    ]);
  });
});
