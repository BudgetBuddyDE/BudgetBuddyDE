import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {TransactionQuery} from '@/utils/transaction-query';
import {TransactionWorkspace} from './transaction-workspace';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  deleteTransaction: vi.fn(),
  saveTransactions: vi.fn(),
}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));
vi.mock('@/hooks/use-desktop-feature', () => ({useDesktopFeature: () => false}));
vi.mock('@/lib/transaction-mutations', () => ({
  deleteTransaction: mocks.deleteTransaction,
  saveTransactions: mocks.saveTransactions,
}));

const transaction = {
  id: 'tx-1',
  processedAt: new Date(2026, 6, 16),
  receiver: 'Market',
  transferAmount: -12.34,
  information: null,
  category: {id: 'cat-1', name: 'Food'},
  paymentMethod: {id: 'pay-1', name: 'Card'},
  attachmentCount: 1,
} as unknown as TExpandedTransaction;
const query: TransactionQuery = {
  search: '',
  type: 'all',
  categories: [],
  paymentMethods: [],
  sort: 'date',
  order: 'desc',
  page: 1,
  pageSize: 25,
};
const props = {
  initialTransactions: [transaction],
  totalCount: 1,
  categories: [transaction.category],
  paymentMethods: [transaction.paymentMethod],
  query,
};

describe('TransactionWorkspace', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders dense desktop data and functional mobile actions', () => {
    render(<TransactionWorkspace {...props} />);
    expect(screen.getAllByText('Market')).toHaveLength(2);
    expect(screen.getAllByText(/€12.34/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', {name: 'Add transaction'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Edit Market'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Export filtered CSV'})).toHaveAttribute(
      'href',
      '/api/export/transactions?scope=filtered&format=csv',
    );
  });

  it('launches the create workflow from a command intent', async () => {
    render(<TransactionWorkspace {...props} initialIntent="create" />);
    expect(await screen.findByRole('dialog', {name: 'New transaction'})).toBeInTheDocument();
  });

  it('writes filters and pagination into the URL', () => {
    render(<TransactionWorkspace {...props} />);
    fireEvent.change(screen.getByLabelText('Search transactions'), {target: {value: 'rent'}});
    fireEvent.change(screen.getByLabelText('Transaction type'), {target: {value: 'expense'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Apply filters'}).closest('form')!);
    expect(mocks.push).toHaveBeenCalledWith('/transactions?search=rent&type=expense');
    fireEvent.change(screen.getByLabelText('Rows'), {target: {value: '50'}});
    expect(mocks.push).toHaveBeenCalledWith('/transactions?pageSize=50');
  });

  it('requires confirmation and updates the visible list after deletion', async () => {
    mocks.deleteTransaction.mockResolvedValue(true);
    render(<TransactionWorkspace {...props} />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete Market'}));
    expect(await screen.findByRole('dialog', {name: 'Delete transaction?'})).toHaveTextContent('1 linked attachment');
    fireEvent.click(screen.getByRole('button', {name: 'Delete transaction'}));
    await waitFor(() => expect(mocks.deleteTransaction).toHaveBeenCalledWith('tx-1'));
    expect(await screen.findByRole('status')).toHaveTextContent('Transaction deleted');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('shows a recoverable error instead of stale finance data', () => {
    render(<TransactionWorkspace {...props} error="Reference data failed." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Transactions unavailable');
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
