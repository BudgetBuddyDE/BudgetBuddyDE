import {setRequestCacheScope} from '@budgetbuddyde/api';
import {act, cleanup, render, screen} from '@testing-library/react';
import {useSelector} from 'react-redux';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {transactionSlice} from '@/lib/features/transactions/transactionSlice';
import {makeStore, type RootState} from '@/lib/store';
import {StoreProvider} from './StoreProvider';

const {auth} = vi.hoisted(() => ({
  auth: {
    current: {isPending: true, data: null as null | {user: {id: string}; session: {id: string}}},
  },
}));
vi.mock('@/authClient', () => ({authClient: {useSession: () => auth.current}}));
vi.mock('@budgetbuddyde/api', async importOriginal => {
  const original = await importOriginal<typeof import('@budgetbuddyde/api')>();
  return {...original, setRequestCacheScope: vi.fn(original.setRequestCacheScope)};
});
vi.mock('@/lib/store', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/store')>();
  return {...original, makeStore: vi.fn(original.makeStore)};
});

const PrivateView = () => {
  const keyword = useSelector((state: RootState) => state.transaction.filter.keyword);
  return <div>{keyword ?? 'empty domain state'}</div>;
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.current = {isPending: true, data: null};
});
afterEach(() => {
  cleanup();
  setRequestCacheScope(null);
});

describe('StoreProvider authentication lifecycle', () => {
  it('waits for authentication and scopes/reset domain state on login, session/user changes, and logout', () => {
    const {rerender} = render(
      <StoreProvider>
        <PrivateView />
      </StoreProvider>,
    );
    expect(screen.queryByText('empty domain state')).not.toBeInTheDocument();
    expect(setRequestCacheScope).not.toHaveBeenCalled();

    for (const [userId, sessionId] of [
      ['user-a', 'session-1'],
      ['user-a', 'session-2'],
      ['user-b', 'session-3'],
    ]) {
      auth.current = {isPending: false, data: {user: {id: userId}, session: {id: sessionId}}};
      rerender(
        <StoreProvider>
          <PrivateView />
        </StoreProvider>,
      );
      expect(setRequestCacheScope).toHaveBeenLastCalledWith(`${userId}:${sessionId}`);
      expect(screen.getByText('empty domain state')).toBeInTheDocument();
      const store = vi.mocked(makeStore).mock.results[0].value as ReturnType<typeof makeStore>;
      act(() =>
        store.dispatch(
          transactionSlice.actions.setQueryState({filters: {keyword: `private-${userId}`}, page: 0, pageSize: 15}),
        ),
      );
      expect(screen.getByText(`private-${userId}`)).toBeInTheDocument();
    }

    auth.current = {isPending: true, data: null};
    rerender(
      <StoreProvider>
        <PrivateView />
      </StoreProvider>,
    );
    expect(screen.queryByText('private-user-b')).not.toBeInTheDocument();
    auth.current = {isPending: false, data: null};
    rerender(
      <StoreProvider>
        <PrivateView />
      </StoreProvider>,
    );
    expect(setRequestCacheScope).toHaveBeenLastCalledWith(null);
    expect(screen.getByText('empty domain state')).toBeInTheDocument();
  });

  it('retains domain state while the confirmed session is unchanged', () => {
    auth.current = {isPending: false, data: {user: {id: 'user-a'}, session: {id: 'session-1'}}};
    const {rerender} = render(
      <StoreProvider>
        <PrivateView />
      </StoreProvider>,
    );
    const store = vi.mocked(makeStore).mock.results[0].value as ReturnType<typeof makeStore>;
    act(() =>
      store.dispatch(
        transactionSlice.actions.setQueryState({filters: {keyword: 'current query'}, page: 0, pageSize: 15}),
      ),
    );
    rerender(
      <StoreProvider>
        <PrivateView />
      </StoreProvider>,
    );
    expect(screen.getByText('current query')).toBeInTheDocument();
    expect(setRequestCacheScope).toHaveBeenCalledOnce();
    expect(makeStore).toHaveBeenCalledOnce();
  });
});
