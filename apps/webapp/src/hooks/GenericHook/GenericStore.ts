import {type AuthModel} from 'pocketbase';
import {type StoreApi, type UseBoundStore, create} from 'zustand';

import {pb} from '@/pocketbase';

export interface IGenericStore {
  isLoading: boolean;
  isFetched: boolean;
  fetchedAt: Date | null;
  fetchedBy: AuthModel | null;
  error: Error | null;

  hasError: () => boolean;
  fetchData: () => Promise<void>;
  refreshData: (updateLoadingState?: boolean) => Promise<void>;
  resetStore: () => void;
}

export type TEntityStore<T, X> = IGenericStore & {
  data: T | null;
  getData: () => T | null;
  set: (data: T) => void;
} & X;

export function GenerateGenericStore<T, X = {}>(
  dataFetcherFunction: () => T | Promise<T>,
  additionalAttrs: X = {} as X,
): UseBoundStore<StoreApi<TEntityStore<T, X>>> {
  return create<TEntityStore<T, X>>((set, get) => ({
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
    fetchData: async () => {
      if (get().isLoading) return console.log('Already fetching data! Skipping...');

      set(prev => ({...prev, isLoading: true}));

      try {
        const fetchedData = await dataFetcherFunction();

        set(prev => ({
          ...prev,
          data: fetchedData,
          isLoading: false,
          isFetched: true,
          fetchedAt: new Date(),
          fetchedBy: pb.authStore.model,
        }));
      } catch (err) {
        console.error(err);
        set(prev => ({...prev, error: err as Error, isLoading: false}));
      }
    },
    refreshData: async (updateLoadingState = false) => {
      if (get().isLoading) return console.debug('Already fetching data! Skipping...');
      if (updateLoadingState) set(prev => ({...prev, isLoading: true}));

      try {
        const fetchedData = await dataFetcherFunction();

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
    getData: () => {
      const {data, isFetched, isLoading, fetchData} = get();
      if (!isFetched && !isLoading) {
        fetchData();
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
