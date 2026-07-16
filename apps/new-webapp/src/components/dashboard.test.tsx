import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {Dashboard} from './dashboard';

const now = new Date();
vi.mock('@/lib/finance-provider', () => ({
  useFinance: () => ({
    status: 'success',
    error: null,
    reload: vi.fn(),
    data: {
      categories: [],
      paymentMethods: [],
      transactions: [
        {
          id: 'income',
          processedAt: now,
          receiver: 'Salary',
          transferAmount: 3000,
          information: null,
          categoryId: 'salary',
          categoryName: 'Income',
          paymentMethodId: 'bank',
          paymentMethodName: 'Bank',
          attachmentCount: 0,
        },
        {
          id: 'expense',
          processedAt: now,
          receiver: 'Grocer',
          transferAmount: -500,
          information: null,
          categoryId: 'food',
          categoryName: 'Food',
          paymentMethodId: 'card',
          paymentMethodName: 'Card',
          attachmentCount: 0,
        },
      ],
      recurring: [
        {
          id: 'rent',
          executeAt: 20,
          interval: 'monthly',
          nextExecutionAt: new Date(now.getFullYear(), now.getMonth(), 20),
          paused: false,
          receiver: 'Landlord',
          transferAmount: -900,
          information: null,
          categoryId: 'home',
          categoryName: 'Home',
          paymentMethodId: 'bank',
          paymentMethodName: 'Bank',
        },
      ],
      budgets: [
        {
          id: 'budget',
          type: 'e',
          name: 'Food',
          description: null,
          budget: 600,
          balance: -500,
          categoryIds: ['food'],
          categoryNames: ['Food'],
        },
      ],
    },
  }),
}));

describe('Dashboard', () => {
  it('calculates monthly metrics from the same transaction source', () => {
    render(<Dashboard />);
    expect(screen.getByText('€2,500.00')).toBeVisible();
    expect(screen.getAllByText('€3,000.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('€500.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Landlord')).toBeVisible();
    expect(screen.getByText('Home · monthly')).toBeVisible();
  });

  it('provides direct links to detailed workflows', () => {
    render(<Dashboard />);
    expect(screen.getByRole('link', {name: /view all/i})).toHaveAttribute('href', '/transactions');
    expect(screen.getByRole('link', {name: /manage/i})).toHaveAttribute('href', '/recurring-payments');
  });
});
