import {beforeEach, describe, expect, it, vi} from 'vite-plus/test';
import {BudgetList} from '@/components/Budget/BudgetList';
import {CategoryTable} from '@/components/Category/CategoryTable';
import {budgetSlice} from '@/lib/features/budgets/budgetSlice';
import {act, fireEvent, render, screen, within} from '@/test/testing-library';
import type {TransactionDialogProps} from './TransactionDialog';

const fixtures = vi.hoisted(() => {
  const categories: {id: string; name: string; parentId: string | null; description: null}[] = ['First', 'Second'].map(
    name => ({id: name, name, parentId: null, description: null}),
  );
  return {
    categories,
    budgets: categories.map(category => ({...category, budget: 100, balance: 20, type: 'i', categories: [{category}]})),
    hierarchy: vi.fn(),
    transactions: vi.fn(),
    breakdown: vi.fn(),
    snackbar: vi.fn(),
    dispatch: vi.fn(),
  };
});

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      category: {
        getValueHelp: fixtures.hierarchy,
        getMonthlyBreakdown: fixtures.breakdown,
      },
      transaction: {getAll: fixtures.transactions},
    },
  },
}));
vi.mock('@/lib/hooks', async () => ({
  useAppDispatch: () => fixtures.dispatch,
  useAppSelector: (selector: unknown) => ({
    status: 'idle',
    count: 2,
    filter: {},
    currentPage: 0,
    rowsPerPage: 10,
    data: selector === budgetSlice.selectors.getState ? fixtures.budgets : fixtures.categories,
  }),
}));
vi.mock('@/lib/ibn', () => ({useConsumeIntent: vi.fn()}));
vi.mock('@/components/Snackbar', () => ({useSnackbarContext: () => ({showSnackbar: fixtures.snackbar})}));
vi.mock('@/components/Table', async importOriginal => ({
  ...(await importOriginal<typeof import('@/components/Table')>()),
  EntityTable: ({columns}: {columns: {renderCell: (name: string, row: object) => React.ReactNode}[]}) =>
    fixtures.categories.map(row => <div key={row.id}>{columns[0].renderCell(row.name, row)}</div>),
}));
vi.mock('@/components/Transaction/TransactionDialog', async importOriginal => ({
  ...(await importOriginal<typeof import('@/components/Transaction/TransactionDialog')>()),
  TransactionDialog: ({isOpen, isLoading, error, transactions, onClose, summary}: TransactionDialogProps) =>
    isOpen && (
      <div role="dialog">
        {summary}
        {isLoading ? 'Loading' : (error?.message ?? transactions.map(row => row.receiver).join(', '))}
        <button type="button" onClick={event => onClose?.(event, 'escapeKeyDown')}>
          Close detail
        </button>
      </div>
    ),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(settle => {
    resolve = settle;
  });
  return {promise, resolve};
}

type TransactionsResult = [{data: {receiver: string}[]}, null] | [null, Error];

describe.each([
  ['category', CategoryTable, 'View category details for'],
  ['budget', BudgetList, 'View transactions for'],
] as const)('%s detail requests', (kind, Component, buttonLabel) => {
  const open = async (name: string) => {
    await act(async () => fireEvent.click(screen.getByRole('button', {name: `${buttonLabel} ${name}`})));
  };
  const close = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Close detail'}));

  beforeEach(() => {
    vi.clearAllMocks();
    fixtures.hierarchy.mockReset().mockResolvedValue([fixtures.categories, null]);
    fixtures.transactions.mockReset();
    const categories = fixtures.categories.slice();
    fixtures.breakdown.mockReset().mockImplementation((id: string) => {
      const direct = {income: 0, expenses: 100};
      return Promise.resolve([
        {
          category: categories.find(category => category.id === id),
          parentName: null,
          direct,
          total: direct,
          children: [],
        },
        null,
      ]);
    });
  });

  it.each(['close and reopen', 'replace without closing'])(
    'keeps the newer result when requests resolve out of order: %s',
    async mode => {
      const first = deferred<TransactionsResult>();
      const second = deferred<TransactionsResult>();
      fixtures.transactions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
      render(<Component />);
      await open('First');
      if (mode === 'close and reopen') close();
      await open('Second');
      await act(async () => second.resolve([{data: [{receiver: 'Second booking'}]}, null]));
      await act(async () => first.resolve([{data: [{receiver: 'First booking'}]}, null]));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Second booking');
      expect(dialog).not.toHaveTextContent('First booking');
      if (kind === 'category') {
        expect(dialog).toHaveTextContent('Directly booked on Second');
        expect(dialog).not.toHaveTextContent('Directly booked on First');
      }
    },
  );

  it('stops a closed request before transactions load and ignores its late failure', async () => {
    const first = deferred<[null, Error]>();
    if (kind === 'category') fixtures.breakdown.mockReturnValueOnce(first.promise);
    else
      fixtures.hierarchy.mockImplementation((config?: RequestInit) =>
        config?.cache === 'no-store' ? first.promise : Promise.resolve([fixtures.categories, null]),
      );
    render(<Component />);
    await open('First');
    close();
    await act(async () => first.resolve([null, new Error('Obsolete hierarchy error')]));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fixtures.transactions).not.toHaveBeenCalled();
    expect(fixtures.snackbar).not.toHaveBeenCalled();
  });

  if (kind === 'category') {
    it('uses the current root breakdown when the selected list row still shows a child before promotion', async () => {
      const [first, second] = fixtures.categories;
      const stale = {...first, parentId: second.id};
      fixtures.transactions.mockResolvedValue([{data: []}, null]);
      // Render the stale list row but keep the freshly fetched hierarchy as a root.
      const list = fixtures.categories;
      const selected = list[0];
      list[0] = stale;
      try {
        render(<Component />);
        await open('First');
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveTextContent('First · Breakdown for this month');
        expect(dialog).not.toHaveTextContent('Second > First');
        expect(dialog).toHaveTextContent('Directly booked on First');
        expect(dialog).toHaveTextContent(/Total\s*Income: .*Expenses: .*100/);
      } finally {
        list[0] = selected;
      }
    });

    it('labels the monthly breakdown separately from transaction rows spanning two months', async () => {
      fixtures.transactions.mockResolvedValue([
        {
          data: [
            {receiver: 'This-month booking', processedAt: new Date('2026-11-05T12:00:00Z')},
            {receiver: 'Last-month booking', processedAt: new Date('2026-10-05T12:00:00Z')},
          ],
        },
        null,
      ]);
      render(<Component />);
      await open('First');
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Breakdown for this month');
      expect(dialog).toHaveTextContent('Transactions · All dates');
      expect(dialog).toHaveTextContent('This-month booking, Last-month booking');
      expect(fixtures.transactions).toHaveBeenCalledWith({$categories: ['First']}, {cache: 'no-store'});
    });
  }
});
