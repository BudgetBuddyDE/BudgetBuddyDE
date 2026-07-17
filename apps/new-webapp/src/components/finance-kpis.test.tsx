import {render, screen, within} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {BudgetKpis, RecurringKpis, TransactionKpis} from './finance-kpis';

const retry = vi.fn();
const transaction = {
  id: 't1',
  processedAt: new Date('2026-07-15'),
  receiver: 'Market',
  transferAmount: -40,
  information: null,
  categoryId: 'c1',
  categoryName: 'Groceries',
  paymentMethodId: 'p1',
  paymentMethodName: 'Card',
  attachmentCount: 0,
};

describe('finance KPI sections', () => {
  it('aggregates all supplied filtered transactions with signed semantics and breakdowns', () => {
    render(
      <TransactionKpis
        transactions={[transaction, {...transaction, id: 't2', transferAmount: 100}]}
        periodLabel="July 2026"
        loading={false}
        onRetry={retry}
      />,
    );
    const region = screen.getByRole('region', {name: 'Transaction statistics for July 2026'});
    expect(within(region).getAllByText('€60.00')).toHaveLength(3);
    expect(within(region).getByText('€30.00')).toBeVisible();
    expect(within(screen.getByRole('table', {name: 'By category'})).getByText('Groceries')).toBeVisible();
    expect(within(screen.getByRole('table', {name: 'By payment method'})).getByText('Card')).toBeVisible();
  });

  it('distinguishes active, inactive, and expired recurring payments', () => {
    const base = {
      id: 'r1',
      executeAt: 15,
      interval: 'monthly' as const,
      nextExecutionAt: new Date('2026-08-15'),
      paused: false,
      expiresAt: null,
      receiver: 'Rent',
      transferAmount: -500,
      information: null,
      categoryId: 'c1',
      categoryName: 'Home',
      paymentMethodId: 'p1',
      paymentMethodName: 'Bank',
    };
    render(
      <RecurringKpis
        payments={[base, {...base, id: 'r2', paused: true}, {...base, id: 'r3', expiresAt: new Date('2020-01-01')}]}
        loading={false}
        onRetry={retry}
      />,
    );
    const region = screen.getByRole('region', {name: 'Recurring payment statistics'});
    expect(within(region).getByText('Active').parentElement?.parentElement).toHaveTextContent('1');
    expect(within(region).getByText('Inactive').parentElement?.parentElement).toHaveTextContent('1');
    expect(within(region).getByText('Expired').parentElement?.parentElement).toHaveTextContent('1');
  });

  it('shows explicit zero-allocation and missing-budget states', () => {
    render(
      <BudgetKpis
        budgets={[
          {
            id: 'b1',
            type: 'i',
            name: 'Food',
            description: null,
            budget: 0,
            balance: 0,
            categoryIds: ['c1'],
            categoryNames: ['Food'],
          },
        ]}
        categoryIds={['c1', 'c2', 'c3']}
        periodLabel="July 2026"
        loading={false}
        onRetry={retry}
      />,
    );
    expect(screen.getByText('Not available')).toBeVisible();
    expect(screen.getByText('No allocation')).toBeVisible();
    expect(screen.getByText('1 zero-value budgets')).toBeVisible();
    expect(screen.getByText('2 categories without a budget')).toBeVisible();
  });
});
