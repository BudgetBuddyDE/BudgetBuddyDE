import {type TCategory, type TUser} from '@budgetbuddyde/types';
import {create} from 'zustand';

import {type IBaseStore} from '@/hooks/FETCH_HOOK/IBaseStore';

export interface ICategoryStore<T> extends IBaseStore<T[]> {
  fetchedBy: NonNullable<TUser>['id'] | null;
  fetchedAt: Date | null;
  setFetchedData: (data: T[], fetchedBy: NonNullable<TUser>['id'] | null) => void;
}

export const useCategoryStore = create<ICategoryStore<TCategory>>(set => ({
  data: [],
  fetchedBy: null,
  fetchedAt: null,
  set: data => set({data: data}),
  setFetchedData: (data, fetchedBy) => set({data: data, fetchedBy: fetchedBy, fetchedAt: new Date()}),
  clear: () => set({data: [], fetchedBy: null, fetchedAt: null}),
}));
