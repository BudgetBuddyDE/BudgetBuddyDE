import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {I18nProvider} from '@/lib/i18n';
import {TransactionListDialog, type TransactionScope} from './transaction-list-dialog';

const finance = vi.hoisted(() => ({
  data: {
    transactions: [
      {
        id: 'tx-1',
        processedAt: new Date('2026-07-12'),
        receiver: 'Market',
        transferAmount: -25,
        information: null,
        categoryId: 'food',
        categoryName: 'Food',
        paymentMethodId: 'card',
        paymentMethodName: 'Card',
        attachmentCount: 0,
      },
      {
        id: 'tx-2',
        processedAt: new Date('2026-06-12'),
        receiver: 'Old Market',
        transferAmount: -10,
        information: null,
        categoryId: 'food',
        categoryName: 'Food',
        paymentMethodId: 'card',
        paymentMethodName: 'Card',
        attachmentCount: 0,
      },
      {
        id: 'tx-3',
        processedAt: new Date('2026-07-15'),
        receiver: 'Salary',
        transferAmount: 500,
        information: null,
        categoryId: 'food',
        categoryName: 'Food',
        paymentMethodId: 'card',
        paymentMethodName: 'Card',
        attachmentCount: 0,
      },
    ],
  },
  status: 'success',
  error: null,
  reload: vi.fn(),
}));
vi.mock('@/lib/finance-provider', () => ({useFinance: () => finance}));

function renderDialog(scope: TransactionScope) {
  return render(
    <I18nProvider>
      <TransactionListDialog open onOpenChange={vi.fn()} title="Food transactions" context="July 2026" scope={scope} />
    </I18nProvider>,
  );
}

describe('TransactionListDialog', () => {
  it('uses the complete category and reporting-period scope for rows and totals', () => {
    renderDialog({categoryIds: ['food'], from: new Date('2026-07-01'), to: new Date('2026-07-31T23:59:59')});
    expect(screen.getByRole('dialog', {name: 'Food transactions'})).toHaveAccessibleDescription('July 2026');
    expect(screen.getByRole('table', {name: 'Transactions'})).toHaveTextContent('Market');
    expect(screen.queryByText('Old Market')).not.toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeVisible();
    expect(screen.getByLabelText('Transaction scope total')).toHaveTextContent('€475.00');
  });

  it('applies the budget expense-sign rule to rows and totals', () => {
    renderDialog({
      categoryIds: ['food'],
      type: 'expense',
      from: new Date('2026-07-01'),
      to: new Date('2026-07-31T23:59:59'),
    });
    expect(screen.getByRole('table', {name: 'Transactions'})).toHaveTextContent('Market');
    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Transaction scope total')).toHaveTextContent('-€25.00');
  });

  it('shows an explicit empty state for a scope without transactions', () => {
    renderDialog({categoryIds: ['travel']});
    expect(screen.getByText('No matching transactions')).toBeVisible();
  });
});
