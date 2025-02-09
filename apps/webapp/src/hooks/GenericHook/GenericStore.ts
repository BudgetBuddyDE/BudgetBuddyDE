import {type AuthModel} from 'pocketbase';
import {type StoreApi, type UseBoundStore, create} from 'zustand';

import {logger} from '@/logger';
import {pb} from '@/pocketbase';

export interface IGenericStore<FetchArguments> {
  isLoading: boolean;
  isFetched: boolean;
  fetchedAt: Date | null;
  fetchedBy: AuthModel | null;
  error: Error | null;

  hasError: () => boolean;
  fetchData: (updateLoadingState?: boolean, args?: FetchArguments) => Promise<void>;
  resetStore: () => void;
}

export type TEntityStore<T, X, FA> = IGenericStore<FA> & {
  data: T | null;
  getData: (args?: FA) => T | null;
  refreshData: (updateLoadingState?: boolean, args?: FA) => Promise<void>;
  set: (data: T) => void;
} & X;

const storeLogger = logger.child({label: 'GenericStore'});

export function GenerateGenericStore<T, X = {}, FA = {}>(
  dataFetcherFunction: (args?: FA) => T | Promise<T>,
  additionalAttrs: X = {} as X,
): UseBoundStore<StoreApi<TEntityStore<T, X, FA>>> {
  return create<TEntityStore<T, X, FA>>((set, get) => ({
    ...additionalAttrs,
    data: null,
    isLoading: false,
    isFetched: false,
    fetchedAt: null,
    fetchedBy: null,
    error: null,
    set: data => {
      set(prev => ({...prev, data}));
    },
    hasError: () => {
      return get().error !== null;
    },
    fetchData: async (updateLoadingState, args) => {
      if (get().isLoading) {
        storeLogger.debug('Already fetching data! Skipping...');
        return;
      }

      if (updateLoadingState) set(prev => ({...prev, isLoading: true}));

      try {
        const sessionUser = pb.authStore.model;
        if (!sessionUser) {
          throw new Error('User not authenticated');
        }
        const fetchedData = await dataFetcherFunction(args);

        set(prev => ({
          ...prev,
          data: fetchedData,
          isFetched: true,
          fetchedAt: new Date(),
          fetchedBy: sessionUser.id,
          ...(updateLoadingState && {isLoading: false}),
        }));
      } catch (err) {
        storeLogger.error("Something wen't wrong", err);
        set(prev => ({...prev, error: err as Error, isLoading: false}));
      }
    },
    refreshData: async (updateLoadingState, args) => {
      const {fetchData} = get();
      storeLogger.debug('GenericStore - refreshData', args);
      return await fetchData(updateLoadingState, args);
    },
    getData: args => {
      const {data, isFetched, isLoading, fetchData, fetchedBy} = get();
      if (!isFetched && !isLoading) {
        fetchData(true, args);
        return null;
      }
      const sessionUser = pb.authStore.model;
      if (isFetched && sessionUser && fetchedBy !== sessionUser.id) {
        storeLogger.debug('Locally stored data is from another user-session. Refetching...');
        fetchData(true, args);
        return null;
      }
      return data;
    },
    resetStore: () => {
      set(prev => ({
        ...prev,
        data: null,
        isLoading: false,
        isFetched: false,
        fetchedAt: null,
        fetchedBy: null,
        error: null,
      }));
    },
  }));
}
