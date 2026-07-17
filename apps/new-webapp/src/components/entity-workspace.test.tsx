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
    recurring: [
      {
        id: 'rec-1',
        executeAt: 1,
        interval: 'monthly',
        nextExecutionAt: new Date('2026-08-01'),
        paused: false,
        receiver: 'Rent',
        transferAmount: -900,
        information: null,
        categoryId: 'cat-1',
        categoryName: 'Groceries',
        paymentMethodId: 'pay-1',
        paymentMethodName: 'Visa',
      },
    ],
    budgets: [
      {
        id: 'budget-1',
        type: 'e',
        name: 'Food budget',
        description: null,
        budget: 500,
        balance: 200,
        categoryIds: ['cat-1'],
        categoryNames: ['Groceries'],
      },
    ],
  },
}));
vi.mock('@/lib/finance-provider', () => ({
  useFinance: () => ({...finance, status: 'success', error: null, mutationPending: false}),
}));

describe('EntityWorkspace', () => {
  it('renders dense transaction data with selection and action tooltips', async () => {
    render(<EntityWorkspace kind="transactions" />);
    expect(screen.getByRole('table', {name: 'Transactions'})).toHaveTextContent('Market');
    expect(screen.getByText('-€42.50')).toBeVisible();
    expect(screen.getByRole('checkbox', {name: 'Select Market'})).toBeVisible();
    const editButton = screen.getByRole('button', {name: 'Edit Market'});
    expect(editButton).toBeVisible();
    await userEvent.hover(editButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Edit Market');
    expect(screen.queryByRole('button', {name: 'More table actions'})).not.toBeInTheDocument();
  });

  it('shows category deletion impact in tabs for all affected entities', async () => {
    render(<EntityWorkspace kind="categories" />);
    await userEvent.click(screen.getByRole('checkbox', {name: 'Select Groceries'}));
    await userEvent.click(screen.getByRole('button', {name: 'Delete selected'}));
    const dialog = screen.getByRole('dialog', {name: 'Delete 1 selected category?'});
    expect(within(dialog).getByRole('tab', {name: /Transactions 1/})).toHaveAttribute('aria-selected', 'true');
    expect(within(dialog).getByText('Market')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('tab', {name: /Recurring payments 1/}));
    expect(within(dialog).getByText('Rent')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('tab', {name: /Budgets 1/}));
    expect(within(dialog).getByText('Food budget')).toBeVisible();
  });

  it('shows payment-method deletion impact for transactions and recurring payments', async () => {
    render(<EntityWorkspace kind="payment-methods" />);
    await userEvent.click(screen.getByRole('checkbox', {name: 'Select Visa'}));
    await userEvent.click(screen.getByRole('button', {name: 'Delete selected'}));
    const dialog = screen.getByRole('dialog', {name: 'Delete 1 selected payment method?'});
    expect(within(dialog).getByRole('tab', {name: /Transactions 1/})).toBeVisible();
    expect(within(dialog).getByText('Market')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('tab', {name: /Recurring payments 1/}));
    expect(within(dialog).getByText('Rent')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('tab', {name: /Budgets 0/}));
    expect(within(dialog).getByText('No affected budgets.')).toBeVisible();
  });

  it('shows deletion impact from a category row action', async () => {
    render(<EntityWorkspace kind="categories" />);
    await userEvent.click(screen.getByRole('button', {name: 'Delete Groceries'}));
    const dialog = screen.getByRole('dialog', {name: 'Delete Groceries?'});
    expect(within(dialog).getByRole('tab', {name: /Transactions 1/})).toBeVisible();
    expect(within(dialog).getByText('Market')).toBeVisible();
    await userEvent.click(within(dialog).getByRole('tab', {name: /Budgets 1/}));
    expect(within(dialog).getByText('Food budget')).toBeVisible();
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

  it('deletes and exports selected rows in CSV and JSON', async () => {
    const createObjectUrl = vi.fn().mockReturnValue('blob:export');
    const revokeObjectUrl = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: {value: createObjectUrl, configurable: true},
      revokeObjectURL: {value: revokeObjectUrl, configurable: true},
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<EntityWorkspace kind="transactions" />);

    await userEvent.click(screen.getByRole('checkbox', {name: 'Select Market'}));
    await userEvent.click(screen.getByRole('button', {name: 'Export selected CSV'}));
    await userEvent.click(screen.getByRole('button', {name: 'Export selected JSON'}));
    expect(createObjectUrl).toHaveBeenCalledTimes(2);
    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(2);

    await userEvent.click(screen.getByRole('button', {name: 'Delete selected'}));
    const dialog = screen.getByRole('dialog', {name: 'Delete 1 selected transaction?'});
    await userEvent.click(within(dialog).getByRole('button', {name: 'Delete selected'}));
    expect(finance.deleteEntity).toHaveBeenCalledWith('transactions', 'tx-1');
    expect(screen.queryByRole('button', {name: 'Delete selected'})).not.toBeInTheDocument();
    click.mockRestore();
  });

  it('shows the required loading and empty states', () => {
    finance.data.transactions = [];
    render(<EntityWorkspace kind="transactions" />);
    expect(screen.getByText('Nothing here yet')).toBeVisible();
  });
});
