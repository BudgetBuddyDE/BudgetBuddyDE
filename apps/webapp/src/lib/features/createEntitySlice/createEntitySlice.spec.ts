import type {IBaseGetAllQuery, TResult} from '@budgetbuddyde/api';
import {configureStore} from '@reduxjs/toolkit';
import {describe, expect, it, vi} from 'vitest';
import type {TApiResponse} from '@/types';
import {createEntitySlice} from './createEntitySlice';

type Item = {id: string};
type Response = TApiResponse<Item[]>;

const response = (id: string, totalCount = 1): TResult<Response> => [{status: 200, totalCount, data: [{id}]}, null];

describe('createEntitySlice request state', () => {
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
