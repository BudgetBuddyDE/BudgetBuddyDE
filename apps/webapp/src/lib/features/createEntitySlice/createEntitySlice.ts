import type {IBaseGetAllQuery, TResult} from '@budgetbuddyde/api';
import type {PayloadAction} from '@reduxjs/toolkit';
import {appConfig} from '@/appConfig';
import {createAppSlice} from '@/lib/createAppSlice';
import type {RootState} from '@/lib/store';
import {logger} from '@/logger';
import type {TApiResponse} from '@/types';

export type EntityFilters = {
  keyword: string | null;
  /** Transaction-specific: filter from this date */
  dateFrom?: Date | null;
  /** Transaction-specific: filter up to this date */
  dateTo?: Date | null;
  /** Shared: include only these category IDs */
  categories?: string[];
  /** Shared: exclude these category IDs */
  excl_categories?: string[];
  /** Shared: include only these payment method IDs */
  paymentMethods?: string[];
  /** Shared: exclude these payment method IDs */
  excl_paymentMethods?: string[];
  /** RecurringPayment-specific: paused state */
  paused?: boolean | null;
};

export type EntitySliceState<T> = {
  count: number;
  data: T | null;
  filter: EntityFilters;
  currentPage: number;
  rowsPerPage: number;
  status: 'idle' | 'loading' | 'failed';
  error: Error | null;
  activeRequestId: string | null;
};

export function createInitialState<T>(initalData?: T): EntitySliceState<T> {
  return {
    count: 0,
    data: initalData || null,
    filter: {keyword: null},
    currentPage: 0,
    rowsPerPage: appConfig.tables.itemPerPage,
    status: 'idle',
    error: null,
    activeRequestId: null,
  };
}

type ResponseBody<T> = TApiResponse<T>;

export function createEntitySlice<T, Q extends IBaseGetAllQuery>(
  name: string,
  getPageFunc: (query?: Q) => Promise<TResult<ResponseBody<T>>>,
  filterMapper?: (filters: EntityFilters) => Partial<Q>,
) {
  const initialState = createInitialState<T>();
  const createQuery = (filters: EntityFilters, page: number, rowsPerPage: number, extra?: Partial<Q>) => {
    const query = {
      from: page * rowsPerPage,
      to: page * rowsPerPage + rowsPerPage,
      ...extra,
    } as Q;
    if (filters.keyword) query.search = filters.keyword;
    if (filterMapper) Object.assign(query, filterMapper(filters));
    return query;
  };
  const entitySlice = createAppSlice({
    name,
    initialState,
    reducers: create => ({
      refresh: create.asyncThunk(
        async (_, api) => {
          const thunkState = api.getState() as RootState;
          const sliceState = thunkState[name];
          const query = createQuery(sliceState.filter, sliceState.currentPage, sliceState.rowsPerPage);
          const [data, err] = await Promise.resolve(getPageFunc(query));
          if (err) throw err;
          // The value we return becomes the `fulfilled` action payload
          return data;
        },
        {
          pending: (state, action) => {
            state.status = 'loading';
            state.error = null;
            state.activeRequestId = action.meta.requestId;
          },
          fulfilled: (state, action) => {
            if (state.activeRequestId !== action.meta.requestId) return;
            state.status = 'idle';
            state.activeRequestId = null;
            // @ts-expect-error
            state.data = action.payload.data;
            state.count = action.payload.totalCount || 0;
            state.currentPage = Math.min(
              state.currentPage,
              Math.max(0, Math.ceil(state.count / state.rowsPerPage) - 1),
            );
          },
          rejected: (state, action) => {
            if (state.activeRequestId !== action.meta.requestId) return;
            state.status = 'failed';
            state.activeRequestId = null;
            state.error = action.error as Error;
          },
        },
      ),
      getPage: create.asyncThunk(
        async (
          {
            page,
            rowsPerPage,
            query: q,
          }: {
            page: number;
            rowsPerPage: number;
            query?: Q;
          },
          api,
        ) => {
          if (page < 0) {
            logger.warn(`Requested page ${page} is invalid, resetting to 0`);
            page = 0;
          }

          // Get cached filters
          const thunkState = api.getState() as RootState;
          const sliceState = thunkState[name];
          const currentFilters = sliceState.filter;
          const query = createQuery(currentFilters, page, rowsPerPage, q);
          const [data, err] = await Promise.resolve(getPageFunc(query));
          if (err) throw err;
          // The value we return becomes the `fulfilled` action payload
          return data;
        },
        {
          pending: (state, action) => {
            state.status = 'loading';
            state.error = null;
            state.activeRequestId = action.meta.requestId;
          },
          fulfilled: (state, action) => {
            if (state.activeRequestId !== action.meta.requestId) return;
            state.status = 'idle';
            state.activeRequestId = null;
            state.currentPage = Math.min(
              action.meta.arg?.page,
              Math.max(0, Math.ceil((action.payload.totalCount || 0) / action.meta.arg.rowsPerPage) - 1),
            );
            state.rowsPerPage = action.meta.arg?.rowsPerPage;
            // @ts-expect-error
            state.data = action.payload.data;
            state.count = action.payload.totalCount || 0;
          },
          rejected: (state, action) => {
            if (state.activeRequestId !== action.meta.requestId) return;
            state.status = 'failed';
            state.activeRequestId = null;
            state.error = action.error as Error;
          },
        },
      ),
      applyFilters: create.asyncThunk(
        async (filters: Partial<EntityFilters>, api) => {
          const state = api.getState() as RootState;
          const currentSliceState = state[name] as EntitySliceState<T>;
          const mergedFilters: EntityFilters = {...currentSliceState.filter, ...filters};
          const query = createQuery(mergedFilters, 0, currentSliceState.rowsPerPage);
          const [data, err] = await Promise.resolve(getPageFunc(query));
          if (err) throw err;
          return {data: data, filters: filters};
        },
        {
          pending: (state, action) => {
            state.status = 'loading';
            state.error = null;
            state.activeRequestId = action.meta.requestId;
          },
          fulfilled: (state, action) => {
            if (state.activeRequestId !== action.meta.requestId) return;
            state.status = 'idle';
            state.activeRequestId = null;
            state.currentPage = 0; // Reset to first page, because we have a new set of data
            // Merge current filters with new applied filters
            state.filter = {...state.filter, ...action.payload.filters};
            const data = action.payload.data;
            // @ts-expect-error
            state.data = data.data;
            state.count = data.totalCount || 0;
          },
          rejected: (state, action) => {
            if (state.activeRequestId !== action.meta.requestId) return;
            state.status = 'failed';
            state.activeRequestId = null;
            state.error = action.error as Error;
          },
        },
      ),
      setFilters: create.reducer((state, action: PayloadAction<Partial<EntityFilters>>) => {
        state.filter = {keyword: null, ...action.payload};
      }),
      setQueryState: create.reducer(
        (state, action: PayloadAction<{filters: Partial<EntityFilters>; page: number; pageSize: number}>) => {
          const nextFilter = {keyword: null, ...action.payload.filters};
          const hasQueryChanged =
            JSON.stringify(state.filter) !== JSON.stringify(nextFilter) ||
            state.currentPage !== action.payload.page ||
            state.rowsPerPage !== action.payload.pageSize;
          state.filter = nextFilter;
          state.currentPage = action.payload.page;
          state.rowsPerPage = action.payload.pageSize;
          if (hasQueryChanged) {
            state.data = null;
            state.count = 0;
            state.status = 'loading';
            state.error = null;
            state.activeRequestId = null;
          } else if (state.data === null && state.status === 'idle') {
            state.status = 'loading';
          }
        },
      ),
      setPage: create.reducer((state, action: PayloadAction<number>) => {
        state.currentPage = action.payload;
      }),
      setRowsPerPage: create.reducer((state, action: PayloadAction<number>) => {
        state.rowsPerPage = action.payload;
      }),
      reset: create.reducer(() => createInitialState<T>()),
    }),
    selectors: {
      getState: state => {
        return state;
      },
    },
  });

  return entitySlice;
}
