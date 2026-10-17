'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TInsightsReport} from '@budgetbuddyde/api/insights';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedTransaction} from '@budgetbuddyde/api/types';
import {Stack} from '@mui/material';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import {apiClient} from '@/apiClient';
import {tryParseLocalDateOnly} from '@/utils/dateOnly';
import {Formatter} from '@/utils/Formatter';
import {
  parseInsightsFilterIds,
  selectInsightsFilterOptions,
  serializeInsightsSearchParams,
} from '../insightsFilterState';
import {InsightsReportFilters} from '../InsightsReportFilters/InsightsReportFilters';
import {InsightsReportView} from '../InsightsReportView/InsightsReportView';

type Granularity = NonNullable<IGetInsightsReportQuery['$granularity']>;
type Comparison = NonNullable<IGetInsightsReportQuery['$comparison']>;

const parseDateParam = (value: string | null, fallback: Date) => tryParseLocalDateOnly(value) ?? fallback;
const parseGranularity = (value: string | null): Granularity =>
  ['auto', 'day', 'week', 'month'].includes(value ?? '') ? (value as Granularity) : 'auto';
const parseComparison = (value: string | null): Comparison =>
  ['previous', 'none'].includes(value ?? '') ? (value as Comparison) : 'previous';
const parseTransactionPage = (value: string | null): number => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page - 1 : 0;
};
const parseTransactionPageSize = (value: string | null): number => {
  const size = Number(value);
  return [10, 15, 25, 50, 100].includes(size) ? size : 10;
};

export const InsightsReportDashboard: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsString = searchParams.toString();
  const defaultDatesRef = React.useRef<{from: Date; to: Date} | null>(null);
  if (defaultDatesRef.current === null) {
    const today = new Date();
    defaultDatesRef.current = {
      from: Formatter.date.startOfMonth(Formatter.date.subMonths(today, 11)),
      to: today,
    };
  }
  const defaultDates = defaultDatesRef.current;
  const [syncedSearchParamsString, setSyncedSearchParamsString] = React.useState(searchParamsString);
  const [hydratedSearchParamsString, setHydratedSearchParamsString] = React.useState<string | null>(null);
  const previousSearchParamsRef = React.useRef(searchParamsString);
  const normalizedInitialUrlRef = React.useRef(false);
  const initialFrom = parseDateParam(searchParams.get('from'), defaultDates.from);
  const initialTo = parseDateParam(searchParams.get('to'), defaultDates.to);
  const initialRangeIsValid = initialFrom <= initialTo;
  const [from, setFrom] = React.useState(initialRangeIsValid ? initialFrom : defaultDates.from);
  const [to, setTo] = React.useState(initialRangeIsValid ? initialTo : defaultDates.to);
  const [categories, setCategories] = React.useState<TCategoryVH[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<TPaymentMethodVH[]>([]);
  const [categoryOptions, setCategoryOptions] = React.useState<TCategoryVH[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = React.useState<TPaymentMethodVH[]>([]);
  const [filterOptionsReady, setFilterOptionsReady] = React.useState(false);
  const [filterOptionsError, setFilterOptionsError] = React.useState<Error | null>(null);
  const [filterOptionsRetry, setFilterOptionsRetry] = React.useState(0);
  const [filtersHydrated, setFiltersHydrated] = React.useState(false);
  const [granularity, setGranularity] = React.useState<Granularity>(parseGranularity(searchParams.get('granularity')));
  const [comparison, setComparison] = React.useState<Comparison>(parseComparison(searchParams.get('comparison')));
  const [report, setReport] = React.useState<TInsightsReport | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reportRetry, setReportRetry] = React.useState(0);
  const previousReportQueryRef = React.useRef<string | null>(null);
  const [transactions, setTransactions] = React.useState<TExpandedTransaction[]>([]);
  const [transactionCount, setTransactionCount] = React.useState(0);
  const [transactionsError, setTransactionsError] = React.useState<Error | null>(null);
  const [transactionsLoading, setTransactionsLoading] = React.useState(true);
  const [transactionsRetry, setTransactionsRetry] = React.useState(0);
  const previousTransactionsQueryRef = React.useRef<string | null>(null);
  const [transactionPage, setTransactionPage] = React.useState(() => parseTransactionPage(searchParams.get('page')));
  const [transactionRowsPerPage, setTransactionRowsPerPage] = React.useState(() =>
    parseTransactionPageSize(searchParams.get('pageSize')),
  );
  const latestUrlStateRef = React.useRef({
    from,
    to,
    categories,
    paymentMethods,
    granularity,
    comparison,
    page: transactionPage,
    pageSize: transactionRowsPerPage,
  });
  const pendingUrlQueriesRef = React.useRef(new Set<string>());
  const latestPendingUrlQueryRef = React.useRef<string | null>(null);
  const isIntermediatePendingUrl =
    pendingUrlQueriesRef.current.has(searchParamsString) && latestPendingUrlQueryRef.current !== searchParamsString;

  const query = React.useMemo<IGetInsightsReportQuery>(
    () => ({
      $dateFrom: from,
      $dateTo: to,
      $categories: categories.map(category => category.id),
      $paymentMethods: paymentMethods.map(paymentMethod => paymentMethod.id),
      $granularity: granularity,
      $comparison: comparison,
    }),
    [from, to, categories, paymentMethods, granularity, comparison],
  );

  const writeUrl = React.useCallback(
    (
      overrides: Partial<{
        from: Date;
        to: Date;
        categories: TCategoryVH[];
        paymentMethods: TPaymentMethodVH[];
        granularity: Granularity;
        comparison: Comparison;
        page: number;
        pageSize: number;
      }>,
    ) => {
      const current = latestUrlStateRef.current;
      const next = {...current, ...overrides};
      latestUrlStateRef.current = next;
      const params = new URLSearchParams(latestPendingUrlQueryRef.current ?? searchParamsString);
      const queryParams = serializeInsightsSearchParams({
        from: next.from,
        to: next.to,
        categories: next.categories,
        paymentMethods: next.paymentMethods,
        granularity: next.granularity,
        comparison: next.comparison,
        params,
      });
      const nextParams = new URLSearchParams(queryParams);
      if (next.page > 0) nextParams.set('page', String(next.page + 1));
      else nextParams.delete('page');
      if (next.pageSize !== 10) nextParams.set('pageSize', String(next.pageSize));
      else nextParams.delete('pageSize');
      const queryString = nextParams.toString();
      pendingUrlQueriesRef.current.add(queryString);
      latestPendingUrlQueryRef.current = queryString;
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`, {scroll: false});
    },
    [pathname, router, searchParamsString],
  );

  React.useEffect(() => {
    let ignored = false;
    setFilterOptionsError(null);
    void Promise.allSettled([apiClient.backend.category.getValueHelp(), apiClient.backend.paymentMethod.getValueHelp()])
      .then(([categoryResult, paymentMethodResult]) => {
        if (ignored) return;
        const categoryError =
          categoryResult.status === 'rejected'
            ? categoryResult.reason instanceof Error
              ? categoryResult.reason
              : new Error('Failed to load categories')
            : categoryResult.value[1];
        const paymentMethodError =
          paymentMethodResult.status === 'rejected'
            ? paymentMethodResult.reason instanceof Error
              ? paymentMethodResult.reason
              : new Error('Failed to load payment methods')
            : paymentMethodResult.value[1];
        if (categoryResult.status === 'fulfilled' && !categoryError) setCategoryOptions(categoryResult.value[0] ?? []);
        if (paymentMethodResult.status === 'fulfilled' && !paymentMethodError)
          setPaymentMethodOptions(paymentMethodResult.value[0] ?? []);
        setFilterOptionsError(categoryError ?? paymentMethodError ?? null);
      })
      .catch(error => {
        if (!ignored)
          setFilterOptionsError(error instanceof Error ? error : new Error('Failed to process filter options'));
      })
      .finally(() => {
        if (!ignored) setFilterOptionsReady(true);
      });
    return () => {
      ignored = true;
    };
  }, [filterOptionsRetry]);

  React.useEffect(() => {
    if (!filterOptionsReady || isIntermediatePendingUrl) return;
    const params = new URLSearchParams(searchParamsString);
    const categoryIds = parseInsightsFilterIds(params.get('cat'));
    const paymentMethodIds = parseInsightsFilterIds(params.get('pm'));
    // URL IDs remain valid query state even when their display options could not be loaded.
    const nextCategories = selectInsightsFilterOptions(categoryOptions, categoryIds, id => ({
      id: id as TCategoryVH['id'],
      name: id,
      description: null,
    }));
    const nextPaymentMethods = selectInsightsFilterOptions(paymentMethodOptions, paymentMethodIds, id => ({
      id: id as TPaymentMethodVH['id'],
      name: id,
      description: null,
      address: '',
      provider: '',
    }));
    latestUrlStateRef.current = {
      ...latestUrlStateRef.current,
      categories: nextCategories,
      paymentMethods: nextPaymentMethods,
    };
    setCategories(current =>
      current.length === nextCategories.length && current.every((option, index) => option === nextCategories[index])
        ? current
        : nextCategories,
    );
    setPaymentMethods(current =>
      current.length === nextPaymentMethods.length &&
      current.every((option, index) => option === nextPaymentMethods[index])
        ? current
        : nextPaymentMethods,
    );
    setHydratedSearchParamsString(searchParamsString);
    setFiltersHydrated(true);
  }, [categoryOptions, paymentMethodOptions, filterOptionsReady, isIntermediatePendingUrl, searchParamsString]);

  React.useEffect(() => {
    if (previousSearchParamsRef.current === searchParamsString) return;
    previousSearchParamsRef.current = searchParamsString;
    if (pendingUrlQueriesRef.current.has(searchParamsString)) {
      pendingUrlQueriesRef.current.delete(searchParamsString);
      if (latestPendingUrlQueryRef.current !== searchParamsString) return;
    }
    pendingUrlQueriesRef.current.clear();
    latestPendingUrlQueryRef.current = null;
    setSyncedSearchParamsString(searchParamsString);
    const params = new URLSearchParams(searchParamsString);
    const fromParam = params.get('from');
    const toParam = params.get('to');
    const nextFrom = parseDateParam(fromParam, defaultDates.from);
    const nextTo = parseDateParam(toParam, defaultDates.to);
    const rangeIsValid = nextFrom <= nextTo;
    setFrom(rangeIsValid ? nextFrom : defaultDates.from);
    setTo(rangeIsValid ? nextTo : defaultDates.to);
    setGranularity(parseGranularity(params.get('granularity')));
    setComparison(parseComparison(params.get('comparison')));
    const nextPage = parseTransactionPage(params.get('page'));
    const nextPageSize = parseTransactionPageSize(params.get('pageSize'));
    latestUrlStateRef.current = {
      ...latestUrlStateRef.current,
      from: rangeIsValid ? nextFrom : defaultDates.from,
      to: rangeIsValid ? nextTo : defaultDates.to,
      granularity: parseGranularity(params.get('granularity')),
      comparison: parseComparison(params.get('comparison')),
      page: nextPage,
      pageSize: nextPageSize,
    };
    setTransactionPage(nextPage);
    setTransactionRowsPerPage(nextPageSize);
  }, [searchParamsString]);

  React.useEffect(() => {
    if (
      !filterOptionsReady ||
      !filtersHydrated ||
      hydratedSearchParamsString !== searchParamsString ||
      syncedSearchParamsString !== searchParamsString ||
      normalizedInitialUrlRef.current
    )
      return;
    const params = new URLSearchParams(searchParamsString);
    const nextParams = new URLSearchParams(
      serializeInsightsSearchParams({from, to, granularity, comparison, categories, paymentMethods, params}),
    );
    if (transactionPage > 0) nextParams.set('page', String(transactionPage + 1));
    else nextParams.delete('page');
    if (transactionRowsPerPage !== 10) nextParams.set('pageSize', String(transactionRowsPerPage));
    else nextParams.delete('pageSize');
    const nextQuery = nextParams.toString();
    if (nextQuery !== searchParamsString) {
      router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`, {scroll: false});
    }
    normalizedInitialUrlRef.current = true;
  }, [
    filterOptionsReady,
    filtersHydrated,
    hydratedSearchParamsString,
    syncedSearchParamsString,
    searchParamsString,
    categoryOptions.length,
    paymentMethodOptions.length,
    from,
    to,
    granularity,
    comparison,
    categories,
    paymentMethods,
    transactionPage,
    transactionRowsPerPage,
    pathname,
    router,
  ]);

  React.useEffect(() => {
    if (!filtersHydrated) return;
    const ignored = {current: false};
    const queryKey = JSON.stringify(query);
    if (previousReportQueryRef.current !== queryKey) {
      setReport(null);
      previousReportQueryRef.current = queryKey;
    }
    setLoading(true);
    setError(null);
    void apiClient.backend.insights
      .getReport(query)
      .then(([result, requestError]) => {
        if (ignored.current) return;
        if (requestError) setError(requestError);
        else setReport(result?.data ?? null);
      })
      .catch(error => {
        if (!ignored.current) setError(error instanceof Error ? error : new Error('Failed to load report'));
      })
      .finally(() => {
        if (!ignored.current) setLoading(false);
      });
    return () => {
      ignored.current = true;
    };
  }, [filtersHydrated, query, reportRetry]);

  React.useEffect(() => {
    if (!filtersHydrated) return;
    const ignored = {current: false};
    const transactionQuery = {
      from: transactionPage * transactionRowsPerPage,
      to: transactionPage * transactionRowsPerPage + transactionRowsPerPage,
      dateFrom: from,
      dateTo: to,
      categories: categories.map(category => category.id),
      paymentMethods: paymentMethods.map(method => method.id),
    };
    const queryKey = JSON.stringify(transactionQuery);
    if (previousTransactionsQueryRef.current !== queryKey) {
      setTransactions([]);
      setTransactionCount(0);
      previousTransactionsQueryRef.current = queryKey;
    }
    setTransactionsLoading(true);
    setTransactionsError(null);
    void apiClient.backend.transaction
      .getAll({
        $dateFrom: transactionQuery.dateFrom,
        $dateTo: transactionQuery.dateTo,
        $categories: transactionQuery.categories,
        $paymentMethods: transactionQuery.paymentMethods,
        from: transactionQuery.from,
        to: transactionQuery.to,
      })
      .then(([result, requestError]) => {
        if (ignored.current) return;
        if (requestError) {
          setTransactionsError(requestError);
        } else {
          setTransactions(result?.data ?? []);
          setTransactionCount(result?.totalCount ?? 0);
        }
      })
      .catch(error => {
        if (!ignored.current)
          setTransactionsError(error instanceof Error ? error : new Error('Failed to load transactions'));
      })
      .finally(() => {
        if (!ignored.current) setTransactionsLoading(false);
      });
    return () => {
      ignored.current = true;
    };
  }, [
    filtersHydrated,
    from,
    to,
    categories,
    paymentMethods,
    transactionPage,
    transactionRowsPerPage,
    transactionsRetry,
  ]);

  const applyDateRange = (start: Date | null, end: Date | null) => {
    if (start && end) {
      setFrom(start);
      setTo(end);
      setTransactionPage(0);
      writeUrl({from: start, to: end, page: 0});
    }
  };
  const handleTransactionRowsPerPageChange = (rowsPerPage: number) => {
    setTransactionRowsPerPage(rowsPerPage);
    setTransactionPage(0);
    writeUrl({pageSize: rowsPerPage, page: 0});
  };

  return (
    <Stack spacing={2}>
      <InsightsReportFilters
        from={from}
        to={to}
        categories={categories}
        paymentMethods={paymentMethods}
        categoryOptions={categoryOptions}
        paymentMethodOptions={paymentMethodOptions}
        granularity={granularity}
        comparison={comparison}
        onDateRangeChange={applyDateRange}
        onCategoriesChange={value => {
          setCategories(value);
          setTransactionPage(0);
          writeUrl({categories: value, page: 0});
        }}
        onPaymentMethodsChange={value => {
          setPaymentMethods(value);
          setTransactionPage(0);
          writeUrl({paymentMethods: value, page: 0});
        }}
        onGranularityChange={value => {
          setGranularity(value);
          writeUrl({granularity: value});
        }}
        onComparisonChange={value => {
          setComparison(value);
          writeUrl({comparison: value});
        }}
      />
      {filterOptionsError && (
        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
          <span>{filterOptionsError.message}</span>
          <button type="button" onClick={() => setFilterOptionsRetry(retry => retry + 1)}>
            Retry filters
          </button>
        </Stack>
      )}
      <InsightsReportView
        report={report}
        error={error}
        loading={loading}
        categories={categories}
        transactions={transactions}
        transactionCount={transactionCount}
        transactionPage={transactionPage}
        transactionRowsPerPage={transactionRowsPerPage}
        transactionsError={transactionsError}
        transactionsLoading={transactionsLoading}
        onTransactionPageChange={page => {
          setTransactionPage(page);
          writeUrl({page});
        }}
        onTransactionRowsPerPageChange={handleTransactionRowsPerPageChange}
        onRetryTransactions={() => setTransactionsRetry(retry => retry + 1)}
        onRetryReport={() => setReportRetry(retry => retry + 1)}
      />
    </Stack>
  );
};
