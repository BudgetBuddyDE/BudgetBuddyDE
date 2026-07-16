'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import type {TCategory} from '@budgetbuddyde/api/category';
import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {apiClient} from '@/apiClient';
import {FINANCE_DATA_MAX_AGE_MS, createCachePolicy, shouldRefresh} from '@/lib/cache-policy';
import type {
  AsyncStatus,
  BudgetInput,
  EntityInput,
  EntityKind,
  FinanceData,
  RecurringPaymentInput,
  TransactionInput,
} from '@/types/finance';

const EMPTY_DATA: FinanceData = {
  categories: [],
  paymentMethods: [],
  transactions: [],
  recurring: [],
  budgets: [],
};

interface FinanceContextValue {
  data: FinanceData;
  status: AsyncStatus;
  error: string | null;
  mutationPending: boolean;
  notice: string | null;
  cacheKeys: Record<EntityKind, string>;
  reload: (force?: boolean) => Promise<void>;
  createEntity: (kind: EntityKind, input: EntityInput) => Promise<boolean>;
  updateEntity: (kind: EntityKind, id: string, input: EntityInput) => Promise<boolean>;
  deleteEntity: (kind: EntityKind, id: string) => Promise<boolean>;
  mergeEntities: (kind: 'categories' | 'payment-methods', source: string[], target: string) => Promise<boolean>;
  executeRecurring: (id: string) => Promise<boolean>;
  clearNotice: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return 'The finance service is currently unavailable.';
}

function mapTransactions(items: TExpandedTransaction[]) {
  return items.map(item => ({
    id: item.id,
    processedAt: item.processedAt instanceof Date ? item.processedAt : new Date(item.processedAt),
    receiver: item.receiver,
    transferAmount: item.transferAmount,
    information: item.information,
    categoryId: item.category.id,
    categoryName: item.category.name,
    paymentMethodId: item.paymentMethod.id,
    paymentMethodName: item.paymentMethod.name,
    attachmentCount: item.attachmentCount ?? item.attachments?.length ?? 0,
  }));
}

function mapRecurring(items: TExpandedRecurringPayment[]) {
  return items.map(item => ({
    id: item.id,
    executeAt: item.executeAt,
    interval: item.interval,
    nextExecutionAt: apiClient.backend.recurringPayment.determineNextExecutionDate(
      item.executeAt,
      item.interval,
      item.createdAt,
    ),
    paused: item.paused,
    receiver: item.receiver,
    transferAmount: item.transferAmount,
    information: item.information,
    categoryId: item.category.id,
    categoryName: item.category.name,
    paymentMethodId: item.paymentMethod.id,
    paymentMethodName: item.paymentMethod.name,
  }));
}

function mapBudgets(items: TBudget[]) {
  return items.map(item => ({
    id: item.id,
    type: item.type,
    name: item.name,
    description: item.description,
    budget: item.budget,
    balance: item.balance,
    categoryIds: item.categories.map(link => link.categoryId),
    categoryNames: item.categories.map(link => link.category.name),
  }));
}

export function FinanceProvider({userId, children}: {userId: string; children: React.ReactNode}) {
  const [data, setData] = useState<FinanceData>(EMPTY_DATA);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fetchedAt = useRef<number | null>(null);
  const loadingPromise = useRef<Promise<void> | null>(null);

  const cacheKeys = useMemo(
    () => ({
      transactions: createCachePolicy(userId, 'transactions').key,
      categories: createCachePolicy(userId, 'categories').key,
      'payment-methods': createCachePolicy(userId, 'payment-methods').key,
      recurring: createCachePolicy(userId, 'recurring').key,
      budgets: createCachePolicy(userId, 'budgets').key,
    }),
    [userId],
  );

  const reload = useCallback(async (force = false) => {
    if (!force && !shouldRefresh(fetchedAt.current, FINANCE_DATA_MAX_AGE_MS)) return;
    if (loadingPromise.current) return loadingPromise.current;

    const request = (async () => {
      setStatus('loading');
      setError(null);
      const [categoryResult, methodResult, transactionResult, recurringResult, budgetResult] = await Promise.all([
        apiClient.backend.category.getAll(),
        apiClient.backend.paymentMethod.getAll(),
        apiClient.backend.transaction.getAll({from: 0, to: 249}),
        apiClient.backend.recurringPayment.getAll({from: 0, to: 249}),
        apiClient.backend.budget.getAll(),
      ]);
      const firstError = [
        categoryResult[1],
        methodResult[1],
        transactionResult[1],
        recurringResult[1],
        budgetResult[1],
      ].find(Boolean);
      if (firstError) throw firstError;

      const categories = (categoryResult[0]?.data ?? []) as TCategory[];
      const methods = (methodResult[0]?.data ?? []) as TPaymentMethod[];
      const transactions = (transactionResult[0]?.data ?? []) as TExpandedTransaction[];
      const recurring = (recurringResult[0]?.data ?? []) as TExpandedRecurringPayment[];
      const budgets = (budgetResult[0]?.data ?? []) as TBudget[];

      setData({
        categories: categories.map(item => ({id: item.id, name: item.name, description: item.description})),
        paymentMethods: methods.map(item => ({
          id: item.id,
          name: item.name,
          provider: item.provider,
          address: item.address,
          description: item.description,
        })),
        transactions: mapTransactions(transactions),
        recurring: mapRecurring(recurring),
        budgets: mapBudgets(budgets),
      });
      fetchedAt.current = Date.now();
      setStatus('success');
    })()
      .catch(cause => {
        setError(errorMessage(cause));
        setStatus('error');
      })
      .finally(() => {
        loadingPromise.current = null;
      });

    loadingPromise.current = request;
    return request;
  }, []);

  useEffect(() => {
    fetchedAt.current = null;
    void reload(true);
  }, [reload, userId]);

  const runMutation = useCallback(
    async (label: string, operation: () => Promise<readonly [unknown, unknown]>) => {
      setMutationPending(true);
      setNotice(null);
      try {
        const [, mutationError] = await operation();
        if (mutationError) throw mutationError;
        fetchedAt.current = null;
        await reload(true);
        setNotice(label);
        return true;
      } catch (cause) {
        setNotice(errorMessage(cause));
        return false;
      } finally {
        setMutationPending(false);
      }
    },
    [reload],
  );

  const createEntity = useCallback(
    async (kind: EntityKind, input: EntityInput) => {
      switch (kind) {
        case 'categories':
          return runMutation('Category created.', () => apiClient.backend.category.create(input as never));
        case 'payment-methods':
          return runMutation('Payment method created.', () => apiClient.backend.paymentMethod.create(input as never));
        case 'transactions':
          return runMutation('Transaction created.', () => apiClient.backend.transaction.create(input as never));
        case 'recurring':
          return runMutation('Recurring payment created.', () =>
            apiClient.backend.recurringPayment.create(input as never),
          );
        case 'budgets':
          return runMutation('Budget created.', () => apiClient.backend.budget.create(input as never));
      }
    },
    [runMutation],
  );

  const updateEntity = useCallback(
    async (kind: EntityKind, id: string, input: EntityInput) => {
      switch (kind) {
        case 'categories':
          return runMutation('Category updated.', () => apiClient.backend.category.updateById(id, input as never));
        case 'payment-methods':
          return runMutation('Payment method updated.', () =>
            apiClient.backend.paymentMethod.updateById(id, input as never),
          );
        case 'transactions':
          return runMutation('Transaction updated.', () =>
            apiClient.backend.transaction.updateById(id, input as never),
          );
        case 'recurring':
          return runMutation('Recurring payment updated.', () =>
            apiClient.backend.recurringPayment.updateById(id, input as never),
          );
        case 'budgets':
          return runMutation('Budget updated.', () => apiClient.backend.budget.updateById(id, input as never));
      }
    },
    [runMutation],
  );

  const deleteEntity = useCallback(
    async (kind: EntityKind, id: string) => {
      switch (kind) {
        case 'categories':
          return runMutation('Category deleted.', () => apiClient.backend.category.deleteById(id));
        case 'payment-methods':
          return runMutation('Payment method deleted.', () => apiClient.backend.paymentMethod.deleteById(id));
        case 'transactions':
          return runMutation('Transaction deleted.', () => apiClient.backend.transaction.deleteById(id));
        case 'recurring':
          return runMutation('Recurring payment deleted.', () => apiClient.backend.recurringPayment.deleteById(id));
        case 'budgets':
          return runMutation('Budget deleted.', () => apiClient.backend.budget.deleteById(id));
      }
    },
    [runMutation],
  );

  const mergeEntities = useCallback(
    async (kind: 'categories' | 'payment-methods', source: string[], target: string) => {
      if (kind === 'categories') {
        return runMutation('Categories merged.', () =>
          apiClient.backend.category.merge({source: source as never, target: target as never}),
        );
      }
      return runMutation('Payment methods merged.', () =>
        apiClient.backend.paymentMethod.merge({source: source as never, target: target as never}),
      );
    },
    [runMutation],
  );

  const executeRecurring = useCallback(
    (id: string) =>
      runMutation('Recurring payment executed.', () => apiClient.backend.recurringPayment.executePayment(id)),
    [runMutation],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      data,
      status,
      error,
      mutationPending,
      notice,
      cacheKeys,
      reload,
      createEntity,
      updateEntity,
      deleteEntity,
      mergeEntities,
      executeRecurring,
      clearNotice: () => setNotice(null),
    }),
    [
      cacheKeys,
      createEntity,
      data,
      deleteEntity,
      error,
      executeRecurring,
      mergeEntities,
      mutationPending,
      notice,
      reload,
      status,
      updateEntity,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('useFinance must be used inside FinanceProvider.');
  return value;
}
