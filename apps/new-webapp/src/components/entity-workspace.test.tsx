import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {EntityWorkspace} from './entity-workspace';

const finance = vi.hoisted(() => ({
  updateEntity: vi.fn().mockResolvedValue(true),
  createEntity: vi.fn().mockResolvedValue(true),
  deleteEntity: vi.fn().mockResolvedValue(true),
  executeRecurring: vi.fn(),
  mergeEntities: vi.fn().mockResolvedValue(true),
  reload: vi.fn(),
  data: {
    categories: [
      {id: 'cat-1', name: 'Groceries', description: 'Food and household'},
      {id: 'cat-2', name: 'Supermarket', description: 'Legacy category'},
    ],
    paymentMethods: [{id: 'pay-1', name: 'Visa', provider: 'Bank', address: '4242', description: null}],
    transactions: [
      {
        id: 'tx-1',
        processedAt: new Date('2026-07-15'),
        receiver: 'Market',
        transferAmount: -42.5,
        information: 'Weekly shop',
        categoryId: 'cat-1',
        categoryName: 'Groceries',
        paymentMethodId: 'pay-1',
        paymentMethodName: 'Visa',
        attachmentCount: 0,
      },
    ],
    recurring: [],
    budgets: [],
  },
}));
vi.mock('@/lib/finance-provider', () => ({
  useFinance: () => ({...finance, status: 'success', error: null, mutationPending: false}),
}));

describe('EntityWorkspace', () => {
  it('renders dense transaction data with selection and accessible actions', () => {
    render(<EntityWorkspace kind="transactions" />);
    expect(screen.getByRole('table', {name: 'Transactions'})).toHaveTextContent('Market');
    expect(screen.getByText('-€42.50')).toBeVisible();
    expect(screen.getByRole('checkbox', {name: 'Select Market'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Edit Market'})).toBeVisible();
  });

  it('opens a populated editor and saves a valid change', async () => {
    render(<EntityWorkspace kind="categories" />);
    await userEvent.click(screen.getByRole('button', {name: 'Edit Groceries'}));
    const dialog = screen.getByRole('dialog', {name: 'Edit category'});
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Groceries');
    await userEvent.clear(within(dialog).getByLabelText('Name'));
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Everyday food');
    await userEvent.click(within(dialog).getByRole('button', {name: 'Save'}));
    expect(finance.updateEntity).toHaveBeenCalledWith('categories', 'cat-1', {
      name: 'Everyday food',
      description: 'Food and household',
    });
  });

  it('merges selected reference records into an explicit target', async () => {
    render(<EntityWorkspace kind="categories" />);
    await userEvent.click(screen.getByRole('checkbox', {name: 'Select Groceries'}));
    await userEvent.click(screen.getByRole('checkbox', {name: 'Select Supermarket'}));
    await userEvent.click(screen.getByRole('button', {name: 'Merge'}));
    const dialog = screen.getByRole('dialog', {name: 'Merge categories'});
    expect(within(dialog).getByLabelText('Keep this record')).toHaveValue('cat-1');
    await userEvent.click(within(dialog).getByRole('button', {name: 'Merge records'}));
    expect(finance.mergeEntities).toHaveBeenCalledWith('categories', ['cat-2'], 'cat-1');
  });

  it('shows the required loading and empty states', () => {
    finance.data.transactions = [];
    render(<EntityWorkspace kind="transactions" />);
    expect(screen.getByText('Nothing here yet')).toBeVisible();
  });
});
