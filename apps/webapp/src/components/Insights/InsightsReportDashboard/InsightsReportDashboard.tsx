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
  haveSameInsightsFilterIds,
  parseInsightsFilterIds,
  selectInsightsFilterOptions,
  serializeInsightsSearchParams,
} from '../insightsFilterState';
import {InsightsReportFilters} from '../InsightsReportFilters/InsightsReportFilters';
import {InsightsReportView} from '../InsightsReportView/InsightsReportView';

type Granularity = NonNullable<IGetInsightsReportQuery['$granularity']>;
type Comparison = NonNullable<IGetInsightsReportQuery['$comparison']>;

const defaultFrom = () => Formatter.date.startOfMonth(Formatter.date.subMonths(new Date(), 11));
const parseDateParam = (value: string | null, fallback: Date) => tryParseLocalDateOnly(value) ?? fallback;
const parseGranularity = (value: string | null): Granularity =>
  ['auto', 'day', 'week', 'month'].includes(value ?? '') ? (value as Granularity) : 'auto';
const parseComparison = (value: string | null): Comparison =>
  ['previous', 'none'].includes(value ?? '') ? (value as Comparison) : 'previous';

export const InsightsReportDashboard: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsString = searchParams.toString();
  const previousSearchParamsRef = React.useRef(searchParamsString);
  const normalizedInitialUrlRef = React.useRef(false);
  const initialFrom = parseDateParam(searchParams.get('from'), defaultFrom());
  const initialTo = parseDateParam(searchParams.get('to'), new Date());
  const initialRangeIsValid = initialFrom <= initialTo;
  const [from, setFrom] = React.useState(initialRangeIsValid ? initialFrom : defaultFrom());
  const [to, setTo] = React.useState(initialRangeIsValid ? initialTo : new Date());
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
  const [transactionPage, setTransactionPage] = React.useState(0);
  const [transactionRowsPerPage, setTransactionRowsPerPage] = React.useState(10);

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
      const params = new URLSearchParams(searchParamsString);
      const nextPage = overrides.page ?? transactionPage;
      const nextPageSize = overrides.pageSize ?? transactionRowsPerPage;
      const queryParams = serializeInsightsSearchParams({
        from: overrides.from ?? from,
        to: overrides.to ?? to,
        categories: overrides.categories ?? categories,
        paymentMethods: overrides.paymentMethods ?? paymentMethods,
        granularity: overrides.granularity ?? granularity,
        comparison: overrides.comparison ?? comparison,
        params,
      });
      const nextParams = new URLSearchParams(queryParams);
      if (nextPage > 0) nextParams.set('page', String(nextPage + 1));
      if (nextPageSize !== 10) nextParams.set('pageSize', String(nextPageSize));
      else nextParams.delete('pageSize');
      const queryString = nextParams.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`, {scroll: false});
    },
    [
      categories,
      comparison,
      from,
      granularity,
      paymentMethods,
      pathname,
      router,
      searchParamsString,
      to,
      transactionPage,
      transactionRowsPerPage,
    ],
  );

  React.useEffect(() => {
    void Promise.all([apiClient.backend.category.getValueHelp(), apiClient.backend.paymentMethod.getValueHelp()])
      .then(([[loadedCategories, categoryError], [loadedPaymentMethods, paymentMethodError]]) => {
        if (!categoryError) setCategoryOptions(loadedCategories ?? []);
        if (!paymentMethodError) setPaymentMethodOptions(loadedPaymentMethods ?? []);
        setFilterOptionsError(categoryError ?? paymentMethodError ?? null);
      })
      .catch(error =>
        setFilterOptionsError(error instanceof Error ? error : new Error('Failed to load filter options')),
      )
      .finally(() => setFilterOptionsReady(true));
  }, [filterOptionsRetry]);

  React.useEffect(() => {
    if (!filterOptionsReady) return;
    const params = new URLSearchParams(searchParamsString);
    const categoryIds = parseInsightsFilterIds(params.get('cat'));
    const paymentMethodIds = parseInsightsFilterIds(params.get('pm'));
    if (categoryOptions.length || categoryIds.length === 0) {
      const nextCategories = selectInsightsFilterOptions(categoryOptions, categoryIds);
      setCategories(current => (haveSameInsightsFilterIds(current, nextCategories) ? current : nextCategories));
    }
    if (paymentMethodOptions.length || paymentMethodIds.length === 0) {
      const nextPaymentMethods = selectInsightsFilterOptions(paymentMethodOptions, paymentMethodIds);
      setPaymentMethods(current =>
        haveSameInsightsFilterIds(current, nextPaymentMethods) ? current : nextPaymentMethods,
      );
    }
    setFiltersHydrated(true);
  }, [categoryOptions, paymentMethodOptions, filterOptionsReady, searchParamsString]);

  React.useEffect(() => {
    if (previousSearchParamsRef.current === searchParamsString) return;
    previousSearchParamsRef.current = searchParamsString;
    const params = new URLSearchParams(searchParamsString);
    const fromParam = params.get('from');
    const toParam = params.get('to');
    const nextFrom = parseDateParam(fromParam, defaultFrom());
    const nextTo = parseDateParam(toParam, new Date());
    const rangeIsValid = nextFrom <= nextTo;
    setFrom(rangeIsValid ? nextFrom : defaultFrom());
    setTo(rangeIsValid ? nextTo : new Date());
    setGranularity(parseGranularity(params.get('granularity')));
    setComparison(parseComparison(params.get('comparison')));
    const page = Number(params.get('page'));
    setTransactionPage(Number.isSafeInteger(page) && page > 0 ? page - 1 : 0);
    const pageSize = Number(params.get('pageSize'));
    setTransactionRowsPerPage([10, 15, 25, 50, 100].includes(pageSize) ? pageSize : 10);
  }, [searchParamsString]);

  React.useEffect(() => {
    if (!filterOptionsReady || !filtersHydrated || normalizedInitialUrlRef.current) return;
    const params = new URLSearchParams(searchParamsString);
    if (
      (parseInsightsFilterIds(params.get('cat')).length > 0 && categoryOptions.length === 0) ||
      (parseInsightsFilterIds(params.get('pm')).length > 0 && paymentMethodOptions.length === 0)
    )
      return;
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
    void apiClient.backend.insights.getReport(query).then(([result, requestError]) => {
      if (ignored.current) return;
      if (requestError) setError(requestError);
      else setReport(result?.data ?? null);
      setLoading(false);
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
        setTransactionsLoading(false);
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
