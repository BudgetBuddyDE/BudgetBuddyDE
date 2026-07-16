import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {I18nProvider} from '@/lib/i18n';
import {EntityWorkspace} from './entity-workspace';

const finance = vi.hoisted(() => ({
  updateEntity: vi.fn().mockResolvedValue(true),
  createEntity: vi.fn().mockResolvedValue(true),
  deleteEntity: vi.fn().mockResolvedValue(true),
  deleteEntities: vi.fn().mockResolvedValue({deleted: [], failed: []}),
  executeRecurring: vi.fn(),
  mergeEntities: vi.fn().mockResolvedValue(true),
  setTablePageSize: vi.fn(),
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

function renderWorkspace(kind: 'transactions' | 'categories') {
  return render(
    <I18nProvider>
      <EntityWorkspace kind={kind} />
    </I18nProvider>,
  );
}

describe('EntityWorkspace', () => {
  it('renders dense transaction data with selection and accessible actions', () => {
    renderWorkspace('transactions');
    const table = screen.getByRole('table', {name: 'Transactions'});
    expect(table).toHaveTextContent('Market');
    expect(within(table).getByText('-€42.50')).toBeVisible();
    expect(screen.getByRole('checkbox', {name: 'Select Market'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Actions for Market'})).toBeVisible();
  });

  it('opens a populated editor and saves a valid change', async () => {
    renderWorkspace('categories');
    await userEvent.click(screen.getByRole('button', {name: 'Actions for Groceries'}));
    await userEvent.click(screen.getByRole('menuitem', {name: 'Edit Groceries'}));
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
    renderWorkspace('categories');
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
    renderWorkspace('transactions');
    expect(screen.getByText('Nothing here yet')).toBeVisible();
  });
});
