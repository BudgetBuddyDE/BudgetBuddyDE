import {act, cleanup, renderHook} from '@testing-library/react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {parseTransactionQuery, serializeTransactionQuery, type EntityUrlState} from '@/components/Filter/URLUtil';
import {useEntityUrlState} from './useEntityUrlState';

const {dispatch, push, replace} = vi.hoisted(() => ({dispatch: vi.fn(), push: vi.fn(), replace: vi.fn()}));
vi.mock('./hooks', () => ({useAppDispatch: () => dispatch}));

const managedKeys = ['q', 'dateFrom', 'dateTo', 'cat', 'excl_cat', 'pm', 'excl_pm', 'page', 'pageSize'];
const setQueryState = (state: EntityUrlState) => ({type: 'transaction/setQueryState', payload: state});
const useQuery = () => useEntityUrlState(parseTransactionQuery, serializeTransactionQuery, managedKeys, setQueryState);

describe('useEntityUrlState filter updates', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/transactions');
    vi.mocked(useRouter).mockReturnValue({push, replace, back: vi.fn()} as never);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('q=rent&cat=one&pm=two&page=3&pageSize=25&foreign=keep') as never,
    );
    window.history.replaceState(null, '', '/transactions#details');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('preserves omitted filters when applying a partial update and resets the page', () => {
    const {result} = renderHook(useQuery);
    act(() => result.current.updateFilters({paymentMethods: ['new']}));

    const url = new URL(push.mock.calls[0][0], window.location.origin);
    expect(url.searchParams.get('q')).toBe('rent');
    expect(url.searchParams.get('cat')).toBe('one');
    expect(url.searchParams.get('pm')).toBe('new');
    expect(url.searchParams.has('page')).toBe(false);
    expect(url.searchParams.get('pageSize')).toBe('25');
    expect(url.searchParams.get('foreign')).toBe('keep');
    expect(url.hash).toBe('#details');
  });

  it.each(['page', 'pageSize'] as const)('removes default pagination from an existing URL: %s', field => {
    const {result} = renderHook(useQuery);
    act(() => (field === 'page' ? result.current.updatePage(0) : result.current.updatePageSize(15)));
    const url = new URL(push.mock.calls[0][0], window.location.origin);
    expect(url.searchParams.has('page')).toBe(false);
    expect(url.searchParams.get('pageSize')).toBe(field === 'page' ? '25' : null);
    expect(url.searchParams.get('q')).toBe('rent');
    expect(url.searchParams.get('foreign')).toBe('keep');
  });

  it.each([undefined, []])('clears explicitly supplied empty ID filters: %s', categories => {
    const {result} = renderHook(useQuery);
    act(() => result.current.updateFilters({categories}));

    const url = new URL(push.mock.calls[0][0], window.location.origin);
    expect(url.searchParams.has('cat')).toBe(false);
    expect(url.searchParams.get('q')).toBe('rent');
    expect(url.searchParams.get('pm')).toBe('two');
  });

  it.each([undefined, null, ''])('clears an explicitly supplied empty keyword: %s', keyword => {
    const {result} = renderHook(useQuery);
    act(() => result.current.updateFilters({keyword}));

    const url = new URL(push.mock.calls[0][0], window.location.origin);
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.get('cat')).toBe('one');
  });
});
