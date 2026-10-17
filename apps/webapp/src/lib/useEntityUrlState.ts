'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import type {EntityFilters} from './features/createEntitySlice';
import {useAppDispatch} from './hooks';
import type {EntityUrlState} from '@/components/Filter/URLUtil';

export function useEntityUrlState(
  parse: (params: URLSearchParams) => EntityUrlState,
  serialize: (state: EntityUrlState, params?: URLSearchParams) => URLSearchParams,
  managedKeys: readonly string[],
  setQueryState: (state: EntityUrlState) => {type: string; payload: EntityUrlState},
) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const currentState = React.useMemo(() => parse(new URLSearchParams(searchParamsString)), [parse, searchParamsString]);

  React.useLayoutEffect(() => {
    dispatch(setQueryState(currentState));

    const normalizedParams = new URLSearchParams(searchParamsString);
    managedKeys.forEach(key => normalizedParams.delete(key));
    serialize(currentState, normalizedParams);
    const normalizedQuery = normalizedParams.toString();
    if (normalizedQuery !== searchParamsString) {
      router.replace(`${pathname}${normalizedQuery ? `?${normalizedQuery}` : ''}${window.location.hash}`, {
        scroll: false,
      });
    }
  }, [currentState, dispatch, managedKeys, pathname, router, searchParamsString, serialize, setQueryState]);

  const update = React.useCallback(
    (nextState: EntityUrlState) => {
      const params = new URLSearchParams(searchParamsString);
      managedKeys.forEach(key => params.delete(key));
      serialize(nextState, params);
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ''}${window.location.hash}`, {scroll: false});
    },
    [managedKeys, pathname, router, searchParamsString, serialize],
  );

  const updateFilters = React.useCallback(
    (filters: Partial<EntityFilters>) =>
      update({...currentState, filters: {...currentState.filters, ...filters}, page: 0}),
    [currentState, update],
  );

  const updatePage = React.useCallback((page: number) => update({...currentState, page}), [currentState, update]);
  const updatePageSize = React.useCallback(
    (pageSize: number) => update({...currentState, page: 0, pageSize}),
    [currentState, update],
  );

  return {currentState, update, updateFilters, updatePage, updatePageSize};
}
