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
export const InsightsReportDashboard: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialFrom = Formatter.date.asDate(searchParams.get('from'), defaultFrom());
  const initialTo = Formatter.date.asDate(searchParams.get('to'), new Date());
  const [from, setFrom] = React.useState(initialFrom);
  const [to, setTo] = React.useState(initialTo);
  const [categories, setCategories] = React.useState<TCategoryVH[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<TPaymentMethodVH[]>([]);
  const [categoryOptions, setCategoryOptions] = React.useState<TCategoryVH[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = React.useState<TPaymentMethodVH[]>([]);
  const [filterOptionsReady, setFilterOptionsReady] = React.useState(false);
  const [filtersHydrated, setFiltersHydrated] = React.useState(false);
  const [granularity, setGranularity] = React.useState<Granularity>(
    (searchParams.get('granularity') as Granularity) || 'auto',
  );
  const [comparison, setComparison] = React.useState<Comparison>(
    (searchParams.get('comparison') as Comparison) || 'previous',
  );
  const [report, setReport] = React.useState<TInsightsReport | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [transactions, setTransactions] = React.useState<TExpandedTransaction[]>([]);
  const [transactionCount, setTransactionCount] = React.useState(0);
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

  const searchParamsString = searchParams.toString();

  React.useEffect(() => {
    void Promise.all([apiClient.backend.category.getValueHelp(), apiClient.backend.paymentMethod.getValueHelp()])
      .then(([[loadedCategories, categoryError], [loadedPaymentMethods, paymentMethodError]]) => {
        if (!categoryError) setCategoryOptions(loadedCategories ?? []);
        if (!paymentMethodError) setPaymentMethodOptions(loadedPaymentMethods ?? []);
      })
      .finally(() => setFilterOptionsReady(true));
  }, []);

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
    if (!filterOptionsReady || !filtersHydrated) return;
    const currentParams = new URLSearchParams(searchParamsString);
    const currentCategoryIds = parseInsightsFilterIds(currentParams.get('cat'));
    const currentPaymentMethodIds = parseInsightsFilterIds(currentParams.get('pm'));
    if (
      (currentCategoryIds.length > 0 && categoryOptions.length === 0) ||
      (currentPaymentMethodIds.length > 0 && paymentMethodOptions.length === 0)
    ) {
      return;
    }
    const nextSearchParams = serializeInsightsSearchParams({
      from,
      to,
      granularity,
      comparison,
      categories,
      paymentMethods,
    });
    if (nextSearchParams === searchParamsString) return;
    router.replace(pathname + '?' + nextSearchParams, {scroll: false});
  }, [
    from,
    to,
    granularity,
    comparison,
    categories,
    paymentMethods,
    filterOptionsReady,
    filtersHydrated,
    categoryOptions.length,
    paymentMethodOptions.length,
    pathname,
    router,
    searchParamsString,
  ]);

  React.useEffect(() => {
    if (!filtersHydrated) return;
    const ignored = {current: false};
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
  }, [filtersHydrated, query]);

  React.useEffect(() => {
    if (!filtersHydrated) return;
    const ignored = {current: false};
    void apiClient.backend.transaction
      .getAll({
        $dateFrom: from,
        $dateTo: to,
        $categories: categories.map(category => category.id),
        $paymentMethods: paymentMethods.map(paymentMethod => paymentMethod.id),
        from: transactionPage * transactionRowsPerPage,
        to: transactionPage * transactionRowsPerPage + transactionRowsPerPage,
      })
      .then(([result]) => {
        if (ignored.current) return;
        setTransactions(result?.data ?? []);
        setTransactionCount(result?.totalCount ?? 0);
      });
    return () => {
      ignored.current = true;
    };
  }, [filtersHydrated, from, to, categories, paymentMethods, transactionPage, transactionRowsPerPage]);

  const applyDateRange = (start: Date | null, end: Date | null) => {
    if (start && end) {
      setFrom(start);
      setTo(end);
      setTransactionPage(0);
    }
  };
  const handleTransactionRowsPerPageChange = (rowsPerPage: number) => {
    setTransactionRowsPerPage(rowsPerPage);
    setTransactionPage(0);
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
        }}
        onPaymentMethodsChange={value => {
          setPaymentMethods(value);
          setTransactionPage(0);
        }}
        onGranularityChange={setGranularity}
        onComparisonChange={setComparison}
      />
      <InsightsReportView
        report={report}
        error={error}
        loading={loading}
        categories={categories}
        transactions={transactions}
        transactionCount={transactionCount}
        transactionPage={transactionPage}
        transactionRowsPerPage={transactionRowsPerPage}
        onTransactionPageChange={setTransactionPage}
        onTransactionRowsPerPageChange={handleTransactionRowsPerPageChange}
      />
    </Stack>
  );
};
