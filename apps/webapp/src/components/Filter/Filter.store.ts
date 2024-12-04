import {type TCategory, type TPaymentMethod} from '@budgetbuddyde/types';
import {subMonths} from 'date-fns';
import {create} from 'zustand';

import {getFirstDayOfMonth, getLastDayOfMonth} from '@/utils';

export type TFilters = {
  keyword: string | null;
  categories: TCategory['id'][] | null;
  paymentMethods: TPaymentMethod['id'][] | null;
  startDate: Date;
  endDate: Date;
  priceFrom: number | null;
  priceTo: number | null;
};

export const DEFAULT_FILTERS: TFilters = {
  keyword: null,
  categories: null,
  paymentMethods: null,
  startDate: getFirstDayOfMonth(subMonths(new Date(), 12)),
  endDate: getLastDayOfMonth(),
  priceFrom: null,
  priceTo: null,
};

export interface IFilterStore {
  show: boolean;
  filters: TFilters;
  toggleVisibility: () => void;
  setFilters: (filters: TFilters) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<IFilterStore>(set => ({
  show: false,
  filters: DEFAULT_FILTERS,
  toggleVisibility: () => set(({show}) => ({show: !show})),
  setFilters: (filters: TFilters) => set({filters: filters}),
  clearFilters: () => set({filters: DEFAULT_FILTERS}),
}));
