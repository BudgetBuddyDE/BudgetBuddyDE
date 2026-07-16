import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Settings} from './settings';

const state = vi.hoisted(() => ({
  params: new URLSearchParams(),
  updateUser: vi.fn(),
  changeEmail: vi.fn(),
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
  listAccounts: vi.fn(),
  unlinkAccount: vi.fn(),
  createEntity: vi.fn().mockResolvedValue(true),
}));
vi.mock('next/navigation', () => ({useSearchParams: () => state.params, useRouter: () => ({replace: vi.fn()})}));
vi.mock('@/authClient', () => ({
  authClient: {
    useSession: () => ({
      data: {user: {name: 'Alex Morgan', email: 'alex@example.com', emailVerified: true}, session: {token: 'current'}},
      refetch: vi.fn(),
    }),
    updateUser: state.updateUser,
    changeEmail: state.changeEmail,
    listSessions: state.listSessions,
    revokeSession: state.revokeSession,
    deleteUser: vi.fn(),
    listAccounts: state.listAccounts,
    unlinkAccount: state.unlinkAccount,
    apiKey: {list: vi.fn(), create: vi.fn(), delete: vi.fn()},
  },
}));
vi.mock('@/lib/finance-provider', () => ({
  useFinance: () => ({
    data: {
      categories: [{id: 'cat-1', name: 'Groceries', description: null}],
      paymentMethods: [{id: 'pay-1', name: 'Visa', provider: 'Bank', address: '4242', description: null}],
      transactions: [],
      recurring: [],
      budgets: [],
    },
    createEntity: state.createEntity,
  }),
}));

describe('Settings', () => {
  beforeEach(() => {
    state.params = new URLSearchParams();
    state.updateUser.mockResolvedValue({error: null});
    state.changeEmail.mockResolvedValue({error: null});
    localStorage.clear();
    state.listAccounts.mockResolvedValue({data: [], error: null});
    state.unlinkAccount.mockResolvedValue({error: null});
  });

  it('updates profile identity through the authentication service', async () => {
    render(<Settings />);
    const name = screen.getByLabelText('Full name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Alex Taylor');
    await userEvent.click(screen.getByRole('button', {name: 'Save changes'}));
    expect(state.updateUser).toHaveBeenCalledWith({name: 'Alex Taylor'});
    expect(await screen.findByText('Profile changes saved.')).toBeVisible();
  });

  it('persists locale, currency, and theme preferences', async () => {
    state.params = new URLSearchParams('tab=preferences');
    render(<Settings />);
    await userEvent.selectOptions(screen.getByLabelText('Default currency'), 'CHF');
    await userEvent.selectOptions(screen.getByLabelText('Theme'), 'dark');
    await userEvent.click(screen.getByRole('button', {name: 'Save preferences'}));
    expect(localStorage.getItem('budgetbuddy-currency')).toBe('CHF');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('previews valid and invalid CSV rows before import', async () => {
    state.params = new URLSearchParams('tab=data');
    render(<Settings />);
    const csvContent =
      'date,amount,receiver,category,paymentMethod\n2026-07-15,-42,Market,Groceries,Visa\ninvalid,0,,Missing,Unknown';
    vi.stubGlobal(
      'FileReader',
      class {
        result = csvContent;
        error = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        readAsText() {
          this.onload?.();
        }
      },
    );
    const csv = new File([csvContent], 'transactions.csv', {type: 'text/csv'});
    const csvInput = screen.getByLabelText('Choose CSV');
    await userEvent.upload(csvInput, csv);
    expect(csvInput).toHaveProperty('files.length', 1);
    expect(await screen.findByRole('table', {name: 'CSV import preview'})).toHaveTextContent('Market');
    expect(screen.getAllByText(/valid rows/)[0]).toHaveTextContent('1 valid rows');
    expect(screen.getByText(/rows need attention/)).toHaveTextContent('1 rows need attention');
    vi.unstubAllGlobals();
  });

  it('marks the active session and allows other sessions to be revoked', async () => {
    state.params = new URLSearchParams('tab=sessions');
    state.listSessions.mockResolvedValue({
      data: [
        {
          id: 'one',
          token: 'current',
          userId: 'u1',
          expiresAt: new Date('2027-01-01'),
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          ipAddress: '127.0.0.1',
          userAgent: 'Current browser',
        },
        {
          id: 'two',
          token: 'other',
          userId: 'u1',
          expiresAt: new Date('2027-01-01'),
          createdAt: new Date('2026-02-01'),
          updatedAt: new Date('2026-02-01'),
          ipAddress: '10.0.0.2',
          userAgent: 'Other browser',
        },
      ],
      error: null,
    });
    render(<Settings />);
    expect(await screen.findByText('Current browser')).toBeVisible();
    expect(screen.getByText('Current')).toBeVisible();
    expect(screen.getByRole('button', {name: 'Revoke'})).toBeVisible();
  });
});
