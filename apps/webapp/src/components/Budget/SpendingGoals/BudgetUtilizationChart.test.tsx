import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {BudgetUtilizationChart} from './BudgetUtilizationChart';

const {bullet} = vi.hoisted(() => ({bullet: vi.fn()}));
vi.mock('@budgetbuddyde/charts', () => ({
  BulletChart: (props: unknown) => {
    bullet(props);
    return <div />;
  },
}));
afterEach(() => {
  cleanup();
  bullet.mockClear();
});

describe('BudgetUtilizationChart', () => {
  it('compares each independent budget with its own limit and preserves overruns', () => {
    render(
      <BudgetUtilizationChart
        budgets={[
          {id: 'a', name: 'Large', budget: 1000, spent: 100},
          {id: 'b', name: 'Small', budget: 100, spent: 150},
        ]}
      />,
    );
    expect(bullet).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({label: expect.stringContaining('Small'), actual: 150, target: 100, max: 150}),
          expect.objectContaining({label: expect.stringContaining('Large'), actual: 10, target: 100, max: 100}),
        ],
      }),
    );
  });
  it('does not divide by a zero or negative budget limit', () => {
    render(<BudgetUtilizationChart budgets={[{id: 'a', name: 'No limit', budget: 0, spent: 50}]} />);
    expect(screen.getByText(/No positive budget limit/)).toBeInTheDocument();
    expect(bullet).not.toHaveBeenCalled();
  });
  it('shows an empty state even with fewer than three budgets', () => {
    render(<BudgetUtilizationChart budgets={[]} />);
    expect(screen.getByText('No budgets to compare.')).toBeInTheDocument();
  });
});
