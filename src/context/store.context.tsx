import React from 'react';
import { DEFAULT_FILTER_VALUE, getSavedSidebarState, saveSidebarState } from '../components';
import { Budget, Category, PaymentMethod, Subscription, Transaction } from '../models/';
import { BaseListReducer, DailyTransactionReducer, generateBaseState } from '../reducer';
import { BudgetService, SubscriptionService } from '../services';
import type { IFilter, IStoreContext } from '../types/';
import { sortSubscriptionsByExecution } from '../utils';
import { AuthContext } from './auth.context';

export const StoreContext = React.createContext({} as IStoreContext);

export const StoreProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { session } = React.useContext(AuthContext);
  const [loading, setLoading] = React.useState(false);
  const [showDrawer, setShowDrawer] = React.useState(getSavedSidebarState());
  const [transactions, setTransactions] = React.useReducer(
    BaseListReducer<Transaction>,
    generateBaseState<Transaction[]>()
  );
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [budget, setBudget] = React.useState<Budget[]>([]);
  const [categories, setCategories] = React.useReducer(BaseListReducer<Category>, generateBaseState<Category[]>());
  const [paymentMethods, setPaymentMethods] = React.useReducer(
    BaseListReducer<PaymentMethod>,
    generateBaseState<PaymentMethod[]>()
  );
  const [showFilter, setShowFilter] = React.useState(false);
  const [filter, setFilter] = React.useState<IFilter>(DEFAULT_FILTER_VALUE);
  const [dailyTransactions, setDailyTransactions] = React.useReducer(DailyTransactionReducer, {
    selected: null,
    income: [],
    spendings: [],
  });

  React.useMemo(() => saveSidebarState(showDrawer), [showDrawer]);

  React.useEffect(() => {
    if (session && session.user) {
      setLoading(true);
      Promise.all([SubscriptionService.getSubscriptions(), BudgetService.getBudget(String(session?.user?.id))])
        .then(([getSubscriptions, getBudget]) => {
          setSubscriptions(sortSubscriptionsByExecution(getSubscriptions));
          setBudget(getBudget);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  const transactionReceiver = React.useMemo(() => {
    if (!transactions.data) return [];
    return [...new Set(transactions.data.map((transaction) => transaction.receiver))].map((receiver) => ({
      text: receiver,
      value: receiver,
    }));
  }, [transactions]);

  return (
    <StoreContext.Provider
      value={React.useMemo(
        () => ({
          loading,
          setLoading,
          showDrawer,
          setShowDrawer,
          dailyTransactions,
          setDailyTransactions,
          transactions,
          setTransactions,
          transactionReceiver,
          budget,
          setBudget,
          subscriptions,
          setSubscriptions,
          categories,
          setCategories,
          paymentMethods,
          setPaymentMethods,
          showFilter,
          setShowFilter,
          filter,
          setFilter,
        }),
        [
          loading,
          showDrawer,
          dailyTransactions,
          transactions,
          transactionReceiver,
          budget,
          subscriptions,
          categories,
          paymentMethods,
          showFilter,
          filter,
        ]
      )}
    >
      {children}
    </StoreContext.Provider>
  );
};
