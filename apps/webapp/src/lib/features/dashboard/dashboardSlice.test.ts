import {afterEach, describe, expect, it, vi} from 'vitest';
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

import {refreshDashboard} from './dashboardSlice';

const estimatedBudget = {
  expenses: {paid: 100, upcoming: 50},
  income: {received: 500, upcoming: 100},
  freeAmount: 350,
};

function setSuccessfulResponses(estimated = estimatedBudget) {
  api.getEstimatedBudget.mockResolvedValue([estimated, null]);
  api.getTransactions.mockResolvedValue([{data: [], totalCount: 0}, null]);
  api.getOccurrences.mockResolvedValue([{data: [], totalCount: 0}, null]);
  api.getCategoryStats.mockResolvedValue([{stats: []}, null]);
}

function makeDashboardStore() {
  return makeStore();
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('dashboardSlice', () => {
  it('loads all dashboard resources in parallel and deduplicates concurrent refreshes', async () => {
    let resolveEstimated!: (value: unknown) => void;
    api.getEstimatedBudget.mockReturnValue(
      new Promise(resolve => {
        resolveEstimated = resolve;
      }),
    );
    api.getTransactions.mockResolvedValue([{data: [], totalCount: 0}, null]);
    api.getOccurrences.mockResolvedValue([{data: [], totalCount: 0}, null]);
    api.getCategoryStats.mockResolvedValue([{stats: []}, null]);
    const store = makeDashboardStore();

    const firstRefresh = store.dispatch(refreshDashboard('user-1'));
    const duplicateRefresh = store.dispatch(refreshDashboard('user-1'));

    expect(store.getState().dashboard.status).toBe('loading');
    expect(api.getEstimatedBudget).toHaveBeenCalledTimes(1);
    expect(api.getTransactions).toHaveBeenCalledTimes(2);
    expect(api.getOccurrences).toHaveBeenCalledTimes(1);
    expect(api.getCategoryStats).toHaveBeenCalledTimes(1);

    resolveEstimated([estimatedBudget, null]);
    await Promise.all([firstRefresh, duplicateRefresh]);

    expect(store.getState().dashboard.estimatedBudget.data).toEqual(estimatedBudget);
    expect(store.getState().dashboard.status).toBe('idle');
  });

  it('keeps existing data visible while refreshing and replaces it on success', async () => {
    setSuccessfulResponses();
    const store = makeDashboardStore();
    await store.dispatch(refreshDashboard('user-1'));

    let resolveEstimated!: (value: unknown) => void;
    api.getEstimatedBudget.mockReturnValueOnce(
      new Promise(resolve => {
        resolveEstimated = resolve;
      }),
    );
    const refresh = store.dispatch(refreshDashboard('user-1'));

    expect(store.getState().dashboard.status).toBe('refreshing');
    expect(store.getState().dashboard.estimatedBudget.data).toEqual(estimatedBudget);

    const updatedBudget = {...estimatedBudget, freeAmount: 475};
    resolveEstimated([updatedBudget, null]);
    await refresh;

    expect(store.getState().dashboard.estimatedBudget.data).toEqual(updatedBudget);
    expect(store.getState().dashboard.status).toBe('idle');
  });

  it('retains stale resource data when a background refresh fails', async () => {
    setSuccessfulResponses();
    const store = makeDashboardStore();
    await store.dispatch(refreshDashboard('user-1'));

    api.getEstimatedBudget.mockResolvedValueOnce([null, new Error('Budget unavailable')]);
    await store.dispatch(refreshDashboard('user-1'));

    expect(store.getState().dashboard.estimatedBudget.data).toEqual(estimatedBudget);
    expect(store.getState().dashboard.estimatedBudget.error).toBe('Budget unavailable');
    expect(store.getState().dashboard.status).toBe('idle');
  });

  it('clears another user snapshot before loading the current user data', async () => {
    setSuccessfulResponses();
    const store = makeDashboardStore();
    await store.dispatch(refreshDashboard('user-1'));

    api.getEstimatedBudget.mockReturnValueOnce(new Promise(() => {}));
    void store.dispatch(refreshDashboard('user-2'));

    expect(store.getState().dashboard.ownerId).toBe('user-2');
    expect(store.getState().dashboard.estimatedBudget.data).toBeNull();
    expect(store.getState().dashboard.status).toBe('loading');
  });

  it('accepts a new user refresh while the previous user request is still active', async () => {
    let resolveFirstUser!: (value: unknown) => void;
    api.getEstimatedBudget
      .mockReturnValueOnce(new Promise(resolve => (resolveFirstUser = resolve)))
      .mockResolvedValueOnce([{...estimatedBudget, freeAmount: 200}, null]);
    api.getTransactions.mockResolvedValue([{data: [], totalCount: 0}, null]);
    api.getOccurrences.mockResolvedValue([{data: [], totalCount: 0}, null]);
    api.getCategoryStats.mockResolvedValue([{stats: []}, null]);
    const store = makeDashboardStore();

    const firstUserRefresh = store.dispatch(refreshDashboard('user-1'));
    await store.dispatch(refreshDashboard('user-2'));
    resolveFirstUser([estimatedBudget, null]);
    await firstUserRefresh;

    expect(store.getState().dashboard.ownerId).toBe('user-2');
    expect(store.getState().dashboard.estimatedBudget.data?.freeAmount).toBe(200);
    expect(store.getState().dashboard.status).toBe('idle');
  });
});
