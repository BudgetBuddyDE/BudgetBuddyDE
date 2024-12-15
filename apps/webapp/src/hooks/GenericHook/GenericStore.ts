import {type AuthModel} from 'pocketbase';
import {type StoreApi, type UseBoundStore, create} from 'zustand';

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
        console.log('Already fetching data! Skipping...');
        return;
      }

      if (updateLoadingState) set(prev => ({...prev, isLoading: true}));

      try {
        const fetchedData = await dataFetcherFunction(args);

        set(prev => ({
          ...prev,
          data: fetchedData,
          isFetched: true,
          fetchedAt: new Date(),
          fetchedBy: pb.authStore.model,
          ...(updateLoadingState && {isLoading: false}),
        }));
      } catch (err) {
        console.error(err);
        set(prev => ({...prev, error: err as Error, isLoading: false}));
      }
    },
    refreshData: async (updateLoadingState, args) => {
      const {fetchData} = get();
      console.log('GenericStore - refreshData', args);
      return await fetchData(updateLoadingState, args);
    },
    getData: args => {
      const {data, isFetched, isLoading, fetchData} = get();
      if (!isFetched && !isLoading) {
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
