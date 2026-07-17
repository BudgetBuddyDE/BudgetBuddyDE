import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {Reporting} from './reporting';

const now = new Date();
vi.mock('@/lib/finance-provider', () => ({
  useFinance: () => ({
    status: 'success',
    error: null,
    reload: vi.fn(),
    data: {
      categories: [],
      paymentMethods: [],
      recurring: [],
      transactions: [
        {
          id: '1',
          processedAt: now,
          receiver: 'Employer',
          transferAmount: 4000,
          information: null,
          categoryId: 'income',
          categoryName: 'Salary',
          paymentMethodId: 'bank',
          paymentMethodName: 'Bank',
          attachmentCount: 0,
        },
        {
          id: '2',
          processedAt: now,
          receiver: 'Shop',
          transferAmount: -1000,
          information: null,
          categoryId: 'food',
          categoryName: 'Food',
          paymentMethodId: 'bank',
          paymentMethodName: 'Bank',
          attachmentCount: 0,
        },
      ],
      budgets: [
        {
          id: 'b1',
          type: 'e',
          name: 'Food cap',
          description: null,
          budget: 1200,
          balance: -1000,
          categoryIds: ['food'],
          categoryNames: ['Food'],
        },
      ],
    },
  }),
}));

describe('Reporting', () => {
  it('keeps headline totals and accessible category data consistent', () => {
    render(<Reporting />);
    expect(screen.getByText('€3,000.00')).toBeVisible();
    expect(screen.getByText(/75/)).toBeVisible();
    const table = screen.getByRole('table', {name: /category totals/i});
    expect(table).toHaveTextContent('Salary');
    expect(table).toHaveTextContent('Food');
  });

  it('offers reports as CSV and JSON files', () => {
    render(<Reporting />);
    expect(screen.getByRole('button', {name: 'Export CSV'})).toBeEnabled();
    expect(screen.getByRole('button', {name: 'Export JSON'})).toBeEnabled();
  });

  it('supports month and full-year period selection', () => {
    render(<Reporting />);
    const period = screen.getByLabelText('Period');
    expect(period).toHaveValue('month');
    expect(screen.getByRole('button', {name: 'Previous month'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Next month'})).toBeVisible();
  });
});
