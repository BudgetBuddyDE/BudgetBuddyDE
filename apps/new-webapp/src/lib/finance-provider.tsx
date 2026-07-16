'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import type {TCategory} from '@budgetbuddyde/api/category';
import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {apiClient} from '@/apiClient';
import {useFeedback} from '@/components/feedback-provider';
import {FINANCE_DATA_MAX_AGE_MS, createCachePolicy, shouldRefresh} from '@/lib/cache-policy';
import {useI18n} from '@/lib/i18n';
import {DEFAULT_TABLE_PAGE_SIZE, type TablePageSize} from '@/lib/table-state';
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

export interface BulkDeleteResult {
  deleted: string[];
  failed: Array<{id: string; message: string}>;
}

interface FinanceContextValue {
  data: FinanceData;
  status: AsyncStatus;
  error: string | null;
  mutationPending: boolean;
  cacheKeys: Record<EntityKind, string>;
  reload: (force?: boolean) => Promise<void>;
  createEntity: (kind: EntityKind, input: EntityInput) => Promise<boolean>;
  updateEntity: (kind: EntityKind, id: string, input: EntityInput) => Promise<boolean>;
  deleteEntity: (kind: EntityKind, id: string) => Promise<boolean>;
  deleteEntities: (kind: EntityKind, ids: readonly string[]) => Promise<BulkDeleteResult>;
  mergeEntities: (kind: 'categories' | 'payment-methods', source: string[], target: string) => Promise<boolean>;
  setTablePageSize: (kind: EntityKind, pageSize: TablePageSize) => void;
  executeRecurring: (id: string) => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);
function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return fallback;
}

const DATA_PAGE_SIZE = 100;

async function loadAllPages<T>(
  request: (range: {from: number; to: number}) => Promise<unknown>,
  pageSize: number = DATA_PAGE_SIZE,
): Promise<readonly [T[], unknown]> {
  const items: T[] = [];
  let from = 0;
  while (true) {
    const [response, error] = (await request({
      from,
      to: from + pageSize - 1,
    })) as readonly [{data?: T[]; totalCount?: number} | null, unknown];
    if (error || !response) return [items, error ?? new Error('The complete data set could not be loaded.')];
    const page = response.data ?? [];
    items.push(...page);
    if (page.length === 0 || items.length >= (response.totalCount ?? items.length) || page.length < pageSize) break;
    from += page.length;
  }
  return [items, null];
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
    expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
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

function deleteRequest(kind: EntityKind, id: string): Promise<readonly [unknown, unknown]> {
  switch (kind) {
    case 'categories':
      return apiClient.backend.category.deleteById(id);
    case 'payment-methods':
      return apiClient.backend.paymentMethod.deleteById(id);
    case 'transactions':
      return apiClient.backend.transaction.deleteById(id);
    case 'recurring':
      return apiClient.backend.recurringPayment.deleteById(id);
    case 'budgets':
      return apiClient.backend.budget.deleteById(id);
  }
}

export function FinanceProvider({userId, children}: {userId: string; children: React.ReactNode}) {
  const {showToast} = useFeedback();
  const {t} = useI18n();
  const [data, setData] = useState<FinanceData>(EMPTY_DATA);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pageSizes, setPageSizes] = useState<Record<EntityKind, TablePageSize>>({
    transactions: DEFAULT_TABLE_PAGE_SIZE,
    categories: DEFAULT_TABLE_PAGE_SIZE,
    'payment-methods': DEFAULT_TABLE_PAGE_SIZE,
    recurring: DEFAULT_TABLE_PAGE_SIZE,
    budgets: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [mutationPending, setMutationPending] = useState(false);
  const fetchedAt = useRef<number | null>(null);
  const loadingPromise = useRef<Promise<void> | null>(null);

  const cacheKeys = useMemo(
    () => ({
      transactions: createCachePolicy(userId, 'transactions', `pageSize=${pageSizes.transactions}`).key,
      categories: createCachePolicy(userId, 'categories', `pageSize=${pageSizes.categories}`).key,
      'payment-methods': createCachePolicy(userId, 'payment-methods', `pageSize=${pageSizes['payment-methods']}`).key,
      recurring: createCachePolicy(userId, 'recurring', `pageSize=${pageSizes.recurring}`).key,
      budgets: createCachePolicy(userId, 'budgets', `pageSize=${pageSizes.budgets}`).key,
    }),
    [pageSizes, userId],
  );

  const reload = useCallback(
    async (force = false) => {
      if (!force && !shouldRefresh(fetchedAt.current, FINANCE_DATA_MAX_AGE_MS)) return;
      if (loadingPromise.current) return loadingPromise.current;

      const request = (async () => {
        setStatus('loading');
        setError(null);
        const [categoryResult, methodResult, transactionResult, recurringResult, budgetResult] = await Promise.all([
          loadAllPages<TCategory>(range => apiClient.backend.category.getAll(range), pageSizes.categories),
          loadAllPages<TPaymentMethod>(
            range => apiClient.backend.paymentMethod.getAll(range),
            pageSizes['payment-methods'],
          ),
          loadAllPages<TExpandedTransaction>(
            range => apiClient.backend.transaction.getAll(range),
            pageSizes.transactions,
          ),
          loadAllPages<TExpandedRecurringPayment>(
            range => apiClient.backend.recurringPayment.getAll(range),
            pageSizes.recurring,
          ),
          loadAllPages<TBudget>(range => apiClient.backend.budget.getAll(range), pageSizes.budgets),
        ]);
        const firstError = [
          categoryResult[1],
          methodResult[1],
          transactionResult[1],
          recurringResult[1],
          budgetResult[1],
        ].find(Boolean);
        if (firstError) throw firstError;

        const categories = categoryResult[0];
        const methods = methodResult[0];
        const transactions = transactionResult[0];
        const recurring = recurringResult[0];
        const budgets = budgetResult[0];

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
          setError(errorMessage(cause, t('finance.error.unavailable')));
          setStatus('error');
        })
        .finally(() => {
          loadingPromise.current = null;
        });

      loadingPromise.current = request;
      return request;
    },
    [pageSizes, t],
  );

  useEffect(() => {
    fetchedAt.current = null;
    void reload(true);
  }, [reload, userId]);

  const setTablePageSize = useCallback((kind: EntityKind, pageSize: TablePageSize) => {
    setPageSizes(current => (current[kind] === pageSize ? current : {...current, [kind]: pageSize}));
  }, []);

  const runMutation = useCallback(
    async (label: string, operation: () => Promise<readonly [unknown, unknown]>) => {
      setMutationPending(true);
      try {
        const [, mutationError] = await operation();
        if (mutationError) throw mutationError;
        fetchedAt.current = null;
        await reload(true);
        showToast({message: t(label), tone: 'success'});
        return true;
      } catch (cause) {
        showToast({message: errorMessage(cause, t('finance.error.unavailable')), tone: 'error'});
        return false;
      } finally {
        setMutationPending(false);
      }
    },
    [reload, showToast, t],
  );

  const createEntity = useCallback(
    async (kind: EntityKind, input: EntityInput) => {
      switch (kind) {
        case 'categories':
          return runMutation('finance.created.category', () => apiClient.backend.category.create(input as never));
        case 'payment-methods':
          return runMutation('finance.created.paymentMethod', () =>
            apiClient.backend.paymentMethod.create(input as never),
          );
        case 'transactions':
          return runMutation('finance.created.transaction', () => apiClient.backend.transaction.create(input as never));
        case 'recurring':
          return runMutation('finance.created.recurring', () =>
            apiClient.backend.recurringPayment.create(input as never),
          );
        case 'budgets':
          return runMutation('finance.created.budget', () => apiClient.backend.budget.create(input as never));
      }
    },
    [runMutation],
  );

  const updateEntity = useCallback(
    async (kind: EntityKind, id: string, input: EntityInput) => {
      switch (kind) {
        case 'categories':
          return runMutation('finance.updated.category', () =>
            apiClient.backend.category.updateById(id, input as never),
          );
        case 'payment-methods':
          return runMutation('finance.updated.paymentMethod', () =>
            apiClient.backend.paymentMethod.updateById(id, input as never),
          );
        case 'transactions':
          return runMutation('finance.updated.transaction', () =>
            apiClient.backend.transaction.updateById(id, input as never),
          );
        case 'recurring':
          return runMutation('finance.updated.recurring', () =>
            apiClient.backend.recurringPayment.updateById(id, input as never),
          );
        case 'budgets':
          return runMutation('finance.updated.budget', () => apiClient.backend.budget.updateById(id, input as never));
      }
    },
    [runMutation],
  );

  const deleteEntity = useCallback(
    (kind: EntityKind, id: string) => runMutation('finance.deleted.item', () => deleteRequest(kind, id)),
    [runMutation],
  );

  const deleteEntities = useCallback(
    async (kind: EntityKind, ids: readonly string[]): Promise<BulkDeleteResult> => {
      setMutationPending(true);
      const outcomes = await Promise.all(
        ids.map(async id => {
          const [, operationError] = await deleteRequest(kind, id);
          return operationError ? {id, message: errorMessage(operationError, t('finance.error.delete'))} : {id};
        }),
      );
      const deleted = outcomes.filter(outcome => !('message' in outcome)).map(outcome => outcome.id);
      const failed = outcomes.filter((outcome): outcome is {id: string; message: string} => 'message' in outcome);
      if (deleted.length > 0) {
        fetchedAt.current = null;
        await reload(true);
      }
      if (failed.length > 0) {
        showToast({
          message: t('finance.bulkDeleteFailed', {
            deleted: deleted.length,
            failures: failed.map(item => `${item.id}: ${item.message}`).join('; '),
          }),
          tone: 'error',
        });
      } else {
        showToast({message: t('finance.bulkDeleted', {count: deleted.length}), tone: 'success'});
      }
      setMutationPending(false);
      return {deleted, failed};
    },
    [reload, showToast, t],
  );

  const mergeEntities = useCallback(
    async (kind: 'categories' | 'payment-methods', source: string[], target: string) => {
      if (kind === 'categories') {
        return runMutation('finance.merged.categories', () =>
          apiClient.backend.category.merge({source: source as never, target: target as never}),
        );
      }
      return runMutation('finance.merged.paymentMethods', () =>
        apiClient.backend.paymentMethod.merge({source: source as never, target: target as never}),
      );
    },
    [runMutation],
  );

  const executeRecurring = useCallback(
    (id: string) =>
      runMutation('finance.executed.recurring', () => apiClient.backend.recurringPayment.executePayment(id)),
    [runMutation],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      data,
      status,
      error,
      mutationPending,
      cacheKeys,
      reload,
      createEntity,
      updateEntity,
      deleteEntity,
      deleteEntities,
      mergeEntities,
      setTablePageSize,
      executeRecurring,
    }),
    [
      cacheKeys,
      createEntity,
      data,
      deleteEntity,
      deleteEntities,
      error,
      executeRecurring,
      mergeEntities,
      mutationPending,
      setTablePageSize,
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
