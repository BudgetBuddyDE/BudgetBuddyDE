import React from 'react';
import { Budget, Category, PaymentMethod, Subscription, Transaction } from '../models';
import { DailyTransactionReducerAction, DailyTransactionReducerState } from '../reducer/';
import { BaseListReducerAction, BaseListReducerState } from '../reducer/BaseListReducer.reducer';
import type { IFilter } from './index';

export interface IStoreContext {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<IStoreContext['loading']>>;
  showDrawer: boolean;
  setShowDrawer: React.Dispatch<React.SetStateAction<IStoreContext['showDrawer']>>;
  dailyTransactions: DailyTransactionReducerState;
  setDailyTransactions: React.Dispatch<DailyTransactionReducerAction>;
  transactions: BaseListReducerState<Transaction>;
  setTransactions: React.Dispatch<BaseListReducerAction<Transaction>>;
  transactionReceiver: {
    text: string;
    value: string;
  }[];
  subscriptions: Subscription[];
  setSubscriptions: React.Dispatch<React.SetStateAction<IStoreContext['subscriptions']>>;
  budget: Budget[];
  setBudget: React.Dispatch<React.SetStateAction<IStoreContext['budget']>>;
  categories: BaseListReducerState<Category>;
  setCategories: React.Dispatch<BaseListReducerAction<Category>>;
  paymentMethods: BaseListReducerState<PaymentMethod>;
  setPaymentMethods: React.Dispatch<BaseListReducerAction<PaymentMethod>>;
  showFilter: boolean;
  setShowFilter: React.Dispatch<React.SetStateAction<IStoreContext['showFilter']>>;
  filter: IFilter;
  setFilter: React.Dispatch<React.SetStateAction<IStoreContext['filter']>>;
}
