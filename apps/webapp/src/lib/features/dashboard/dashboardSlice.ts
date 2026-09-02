import type {TCategoryStats} from '@budgetbuddyde/api/category';
import type {TEstimatedBudget} from '@budgetbuddyde/api/budget';
import type {TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {addDays} from 'date-fns';
import {apiClient} from '@/apiClient';
import {formatLocalDateOnly} from '@/components/RecurringPayment/dateOnly';
import type {RootState} from '@/lib/store';

type DashboardResource<T> = {
  data: T | null;
  error: string | null;
};

type DashboardResult<T> = {data: T; error: null} | {data: null; error: string};

export type DashboardState = {
  ownerId: string | null;
  estimatedBudget: DashboardResource<TEstimatedBudget>;
  latestTransactions: DashboardResource<TExpandedTransaction[]>;
  upcomingTransactions: DashboardResource<TExpandedTransaction[]>;
  recurringPaymentOccurrences: DashboardResource<TRecurringPaymentOccurrence[]>;
  categoryExpenses: DashboardResource<TCategoryStats['stats']>;
  status: 'idle' | 'loading' | 'refreshing';
};

type DashboardPayload = {
  estimatedBudget: DashboardResult<TEstimatedBudget>;
  latestTransactions: DashboardResult<TExpandedTransaction[]>;
  upcomingTransactions: DashboardResult<TExpandedTransaction[]>;
  recurringPaymentOccurrences: DashboardResult<TRecurringPaymentOccurrence[]>;
  categoryExpenses: DashboardResult<TCategoryStats['stats']>;
};

const emptyResource = <T>(): DashboardResource<T> => ({data: null, error: null});

export const initialDashboardState: DashboardState = {
  ownerId: null,
  estimatedBudget: emptyResource(),
  latestTransactions: emptyResource(),
  upcomingTransactions: emptyResource(),
  recurringPaymentOccurrences: emptyResource(),
  categoryExpenses: emptyResource(),
  status: 'idle',
};

function toResult<T>(data: T | null, error: Error | null): DashboardResult<T> {
  if (error) return {data: null, error: error.message};
  if (data === null) return {data: null, error: 'The dashboard data is unavailable'};
  return {data, error: null};
}

export const refreshDashboard = createAsyncThunk<DashboardPayload, string, {state: RootState}>(
  'dashboard/refresh',
  async () => {
    const now = new Date();
    const through = new Date(now);
    through.setDate(through.getDate() + 365);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [estimated, latest, upcoming, occurrences, categoryStats] = await Promise.all([
      apiClient.backend.budget.getEstimatedBudget(),
      apiClient.backend.transaction.getAll({to: 6, $dateTo: now}),
      apiClient.backend.transaction.getAll({to: 6, $dateFrom: addDays(now, 1)}),
      apiClient.backend.recurringPayment.getOccurrences({
        $dateFrom: formatLocalDateOnly(now),
        $dateTo: formatLocalDateOnly(through),
        from: 0,
        to: 6,
      }),
      apiClient.backend.category.getCategoryStats({from: monthStart, to: monthEnd}),
    ]);
    const [estimatedData, estimatedError] = estimated;

    return {
      estimatedBudget: toResult(estimatedData, estimatedError),
      latestTransactions: toResult(latest[0]?.data ?? null, latest[1]),
      upcomingTransactions: toResult(upcoming[0]?.data ?? null, upcoming[1]),
      recurringPaymentOccurrences: toResult(occurrences[0]?.data ?? null, occurrences[1]),
      categoryExpenses: toResult(categoryStats[0]?.stats ?? null, categoryStats[1]),
    };
  },
  {
    condition: (ownerId, {getState}) => {
      const dashboard = (getState() as RootState).dashboard;
      return (dashboard.status !== 'loading' && dashboard.status !== 'refreshing') || dashboard.ownerId !== ownerId;
    },
  },
);

function hasDashboardData(state: DashboardState): boolean {
  return (
    state.estimatedBudget.data !== null ||
    state.latestTransactions.data !== null ||
    state.upcomingTransactions.data !== null ||
    state.recurringPaymentOccurrences.data !== null ||
    state.categoryExpenses.data !== null
  );
}

function updateResource<T>(resource: DashboardResource<T>, result: DashboardResult<T>): void {
  if (result.data !== null) resource.data = result.data;
  resource.error = result.error;
}

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: initialDashboardState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(refreshDashboard.pending, (state, {meta}) => {
        if (state.ownerId !== null && state.ownerId !== meta.arg) Object.assign(state, initialDashboardState);
        state.ownerId = meta.arg;
        state.status = hasDashboardData(state) ? 'refreshing' : 'loading';
      })
      .addCase(refreshDashboard.fulfilled, (state, {payload, meta}) => {
        if (state.ownerId !== meta.arg) return;
        state.status = 'idle';
        updateResource(state.estimatedBudget, payload.estimatedBudget);
        updateResource(state.latestTransactions, payload.latestTransactions);
        updateResource(state.upcomingTransactions, payload.upcomingTransactions);
        updateResource(state.recurringPaymentOccurrences, payload.recurringPaymentOccurrences);
        updateResource(state.categoryExpenses, payload.categoryExpenses);
      })
      .addCase(refreshDashboard.rejected, (state, {error, meta}) => {
        if (meta.condition || state.ownerId !== meta.arg) return;
        state.status = 'idle';
        const message = error.message ?? 'The dashboard could not be refreshed';
        state.estimatedBudget.error = message;
        state.latestTransactions.error = message;
        state.upcomingTransactions.error = message;
        state.recurringPaymentOccurrences.error = message;
        state.categoryExpenses.error = message;
      });
  },
  selectors: {
    selectDashboard: state => state,
  },
});
