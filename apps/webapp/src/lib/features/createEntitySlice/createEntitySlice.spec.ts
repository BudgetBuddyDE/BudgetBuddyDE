import type {IBaseGetAllQuery, TResult} from '@budgetbuddyde/api';
import {configureStore} from '@reduxjs/toolkit';
import {describe, expect, it, vi} from 'vitest';
import type {TApiResponse} from '@/types';
import {createEntitySlice} from './createEntitySlice';

type Item = {id: string};
type Response = TApiResponse<Item[]>;

const response = (id: string, totalCount = 1): TResult<Response> => [{status: 200, totalCount, data: [{id}]}, null];

describe('createEntitySlice request state', () => {
  describe.each(['getPage', 'refresh', 'applyFilters'] as const)('%s after URL navigation', requestType => {
    it.each([
      ['query', 'success'],
      ['query', 'failure'],
      ['reset', 'success'],
      ['reset', 'failure'],
    ] as const)('ignores stale responses after %s with %s and no newer request', async (change, outcome) => {
      let resolveRequest!: (result: TResult<Response>) => void;
      const getPage = vi.fn(() => new Promise<TResult<Response>>(resolve => (resolveRequest = resolve)));
      const slice = createEntitySlice<Item[], IBaseGetAllQuery>('transaction', getPage);
      const store = configureStore({reducer: {transaction: slice.reducer}});
      const request =
        requestType === 'getPage'
          ? store.dispatch(slice.actions.getPage({page: 0, rowsPerPage: 15}))
          : requestType === 'refresh'
            ? store.dispatch(slice.actions.refresh())
            : store.dispatch(slice.actions.applyFilters({keyword: 'old'}));

      if (change === 'query') {
        store.dispatch(slice.actions.setQueryState({filters: {keyword: 'new'}, page: 2, pageSize: 25}));
      } else store.dispatch(slice.actions.reset());
      const stateAfterNavigation = store.getState().transaction;
      resolveRequest(outcome === 'success' ? response('stale') : [null, new Error('stale error')]);
      await request;
      expect(store.getState().transaction).toEqual(stateAfterNavigation);
    });
  });

  it('keeps only the newest page response and clears a prior error after retry', async () => {
    const pending: Array<(result: TResult<Response>) => void> = [];
    const getPage = vi.fn(
      () =>
        new Promise<TResult<Response>>(resolve => {
          pending.push(resolve);
        }),
    );
    const slice = createEntitySlice<Item[], IBaseGetAllQuery>('transaction', getPage);
    const store = configureStore({reducer: {transaction: slice.reducer}});

    const firstRequest = store.dispatch(slice.actions.getPage({page: 0, rowsPerPage: 15}));
    const secondRequest = store.dispatch(slice.actions.getPage({page: 1, rowsPerPage: 15}));
    pending[1](response('newest', 20));
    await secondRequest;
    pending[0](response('stale'));
    await firstRequest;

    expect(store.getState().transaction.data).toEqual([{id: 'newest'}]);
    expect(store.getState().transaction.currentPage).toBe(1);

    const retry = store.dispatch(slice.actions.getPage({page: 0, rowsPerPage: 15}));
    pending[2]([null, new Error('temporary failure')]);
    await retry;
    expect(store.getState().transaction.status).toBe('failed');

    const recovered = store.dispatch(slice.actions.getPage({page: 0, rowsPerPage: 15}));
    pending[3](response('recovered'));
    await recovered;
    expect(store.getState().transaction.status).toBe('idle');
    expect(store.getState().transaction.error).toBeNull();
    expect(store.getState().transaction.data).toEqual([{id: 'recovered'}]);
  });
});
