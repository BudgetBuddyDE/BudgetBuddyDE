import {type TUser} from '@budgetbuddyde/types';
import {create} from 'zustand';

import {type IBaseStore} from '@/hooks/GenericHook';

import {type TMetalQuote} from './Metal.service';

export interface IMetalStore<T> extends IBaseStore<T[]> {
  fetchedBy: NonNullable<TUser>['id'] | null;
  fetchedAt: Date | null;
  setFetchedData: (data: T[], fetchedBy: NonNullable<TUser>['id'] | null) => void;
}

export const useMetalStore = create<IMetalStore<TMetalQuote>>(set => ({
  data: [],
  fetchedAt: null,
  fetchedBy: null,
  clear: () => set({data: [], fetchedAt: null, fetchedBy: null}),
  set: data => set({data}),
  setFetchedData: (data, fetchedBy) => set({data, fetchedBy, fetchedAt: new Date()}),
}));
