import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {BudgetUtilizationOverview} from './BudgetUtilizationOverview';

const {getAll, state} = vi.hoisted(() => ({getAll: vi.fn(), state: {data: null as unknown, status: 'idle'}}));
vi.mock('@/apiClient', () => ({apiClient: {backend: {budget: {getAll}}}}));
vi.mock('@/lib/hooks', () => ({useAppSelector: () => state}));
vi.mock('./BudgetUtilizationChart', () => ({
  BudgetUtilizationChart: ({budgets}: {budgets: {name: string; spent: number}[]}) => (
    <div>
      {budgets.map(row => (
        <p key={row.name}>
          {row.name}: {row.spent}
        </p>
      ))}
    </div>
  ),
}));
const budget = (name: string) => ({id: name, name, budget: 100, balance: 20});
beforeEach(() => {
  getAll.mockReset();
  state.data = null;
  state.status = 'idle';
});
afterEach(cleanup);

describe('BudgetUtilizationOverview', () => {
  it('loads all budgets instead of comparing only a Redux page or the first ten', async () => {
    state.data = [budget('Page budget')];
    getAll.mockResolvedValue([{data: Array.from({length: 12}, (_, index) => budget(`Budget ${index + 1}`))}, null]);
    render(<BudgetUtilizationOverview />);
    expect(await screen.findByText('Budget 12: 20')).toBeInTheDocument();
    expect(screen.queryByText('Page budget: 20')).not.toBeInTheDocument();
    expect(getAll).toHaveBeenCalledWith({});
    expect(screen.getByRole('link', {name: 'Edit Budget 12'})).toHaveAttribute(
      'href',
      expect.stringContaining('ibnId=Budget+12'),
    );
  });
  it('refreshes a complete comparison after the budget list changes', async () => {
    getAll
      .mockResolvedValueOnce([{data: [budget('Before')]}, null])
      .mockResolvedValueOnce([{data: [budget('After')]}, null]);
    const {rerender} = render(<BudgetUtilizationOverview />);
    expect(await screen.findByText('Before: 20')).toBeInTheDocument();
    state.data = [];
    rerender(<BudgetUtilizationOverview />);
    expect(await screen.findByText('After: 20')).toBeInTheDocument();
    expect(screen.queryByText('Before: 20')).not.toBeInTheDocument();
  });
  it('allows retry after a failed request', async () => {
    getAll
      .mockResolvedValueOnce([null, new Error('Comparison unavailable')])
      .mockResolvedValueOnce([{data: [budget('Recovered')]}, null]);
    render(<BudgetUtilizationOverview />);
    expect(await screen.findByText('Comparison unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    expect(await screen.findByText('Recovered: 20')).toBeInTheDocument();
  });
  it('ignores the old response after the underlying list is refreshed', async () => {
    let resolveOld!: (value: unknown) => void;
    getAll
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce([{data: [budget('New')]}, null]);
    const {rerender} = render(<BudgetUtilizationOverview />);
    await waitFor(() => expect(getAll).toHaveBeenCalledTimes(1));
    state.data = [];
    rerender(<BudgetUtilizationOverview />);
    expect(await screen.findByText('New: 20')).toBeInTheDocument();
    resolveOld([{data: [budget('Old')]}, null]);
    await waitFor(() => expect(screen.queryByText('Old: 20')).not.toBeInTheDocument());
  });
});
