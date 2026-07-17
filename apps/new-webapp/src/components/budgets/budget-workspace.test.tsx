import type {TBudget} from '@budgetbuddyde/api/budget';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BudgetWorkspace} from './budget-workspace';

const mocks = vi.hoisted(() => ({push: vi.fn(), refresh: vi.fn(), remove: vi.fn(), save: vi.fn()}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));
vi.mock('@/lib/budget-mutations', () => ({
  budgetToDraft: () => ({
    name: '',
    type: 'e',
    amount: '',
    period: '2026-07',
    warningThreshold: '80',
    categoryIds: [],
    description: '',
  }),
  saveBudget: mocks.save,
  deleteBudget: mocks.remove,
}));
const budgets = [
  {
    id: 'b1',
    name: 'Food',
    type: 'e',
    budget: 100,
    balance: 120,
    period: '2026-07',
    warningThreshold: 80,
    description: null,
    categories: [{category: {id: 'c1', name: 'Food'}}],
  },
  {
    id: 'b2',
    name: 'Zero',
    type: 'e',
    budget: 0,
    balance: 0,
    period: '2026-07',
    warningThreshold: 80,
    description: null,
    categories: [{category: {id: 'c2', name: 'Other'}}],
  },
] as TBudget[];

describe('BudgetWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());

  it('communicates overruns and zero budgets with text and progress semantics', () => {
    render(<BudgetWorkspace initialBudgets={budgets} categories={[]} period="2026-07" />);
    expect(screen.getByText(/Exceeded by/)).toBeInTheDocument();
    expect(screen.getByText('Zero budget')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', {name: 'Food consumption'})).toHaveAttribute('aria-valuenow', '100');
  });

  it('navigates complete calendar months through URL state', () => {
    render(<BudgetWorkspace initialBudgets={budgets} categories={[]} period="2026-01" />);
    fireEvent.click(screen.getByRole('button', {name: 'Previous month'}));
    expect(mocks.push).toHaveBeenCalledWith('/budgets?period=2025-12');
  });

  it('requires explicit deletion confirmation', async () => {
    mocks.remove.mockResolvedValue(true);
    render(<BudgetWorkspace initialBudgets={budgets} categories={[]} period="2026-07" />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete Food'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Delete budget'}));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('b1'));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
