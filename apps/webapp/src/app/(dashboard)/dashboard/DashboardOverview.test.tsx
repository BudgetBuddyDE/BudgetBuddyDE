import {render, screen, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {refreshDashboard} from '@/lib/features/dashboard/dashboardSlice';
import {makeStore} from '@/lib/store';

const api = vi.hoisted(() => ({
  getEstimatedBudget: vi.fn(),
  getTransactions: vi.fn(),
  getOccurrences: vi.fn(),
  getCategoryStats: vi.fn(),
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      budget: {getEstimatedBudget: api.getEstimatedBudget},
      transaction: {getAll: api.getTransactions},
      recurringPayment: {getOccurrences: api.getOccurrences},
      category: {getCategoryStats: api.getCategoryStats},
    },
  },
}));

vi.mock('@/authClient', () => ({
  authClient: {useSession: () => ({data: {user: {id: 'user-1'}}})},
}));

vi.mock('@/components/Budget/BudgetPieChart', () => ({
  BudgetPieChart: () => <div>Budget chart</div>,
}));

vi.mock('@/components/Category/CategoryPieChart', () => ({
  CategoryExpenseChart: () => <div>Category chart</div>,
}));

vi.mock('@/components/RecurringPayment/RecurringPaymentList/RecurringPaymentList', () => ({
  RecurringPaymentList: () => <div>Recurring payments</div>,
}));

vi.mock('@/components/Transaction/TransactionList/TransactionList', () => ({
  TransactionList: ({subtitle}: {subtitle: string}) => <div>{subtitle}</div>,
}));

import {DashboardOverview} from './DashboardOverview';

const estimatedBudget = {
  expenses: {paid: 100, upcoming: 50},
  income: {received: 500, upcoming: 100},
  freeAmount: 350,
};

function setSuccessfulResponses() {
  api.getEstimatedBudget.mockResolvedValue([estimatedBudget, null]);
  api.getTransactions.mockResolvedValue([{data: [], totalCount: 0}, null]);
  api.getOccurrences.mockResolvedValue([{data: [], totalCount: 0}, null]);
  api.getCategoryStats.mockResolvedValue([{stats: []}, null]);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('DashboardOverview', () => {
  it('shows granular skeletons while no initial snapshot exists', () => {
    api.getEstimatedBudget.mockReturnValue(new Promise(() => {}));
    api.getTransactions.mockReturnValue(new Promise(() => {}));
    api.getOccurrences.mockReturnValue(new Promise(() => {}));
    api.getCategoryStats.mockReturnValue(new Promise(() => {}));

    render(
      <Provider store={makeStore()}>
        <DashboardOverview />
      </Provider>,
    );

    expect(screen.getByLabelText('Loading Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading Category Expenses')).toBeInTheDocument();
    expect(screen.queryByLabelText('Refreshing dashboard')).not.toBeInTheDocument();
  });

  it('keeps a cached snapshot visible during a remount refresh', async () => {
    setSuccessfulResponses();
    const store = makeStore();
    await store.dispatch(refreshDashboard('user-1'));

    api.getEstimatedBudget.mockReturnValueOnce(new Promise(() => {}));
    const {unmount} = render(
      <Provider store={store}>
        <DashboardOverview />
      </Provider>,
    );

    await waitFor(() => expect(screen.getByLabelText('Refreshing dashboard')).toBeInTheDocument());
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Budget chart')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading Budget')).not.toBeInTheDocument();

    unmount();
  });
});
