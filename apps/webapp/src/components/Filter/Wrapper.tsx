'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {Stack} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {logger} from '@/logger';
import {FilterButton} from './FilterButton';
import {FilterDialog, type FilterDialogProps} from './FilterDialog';
import {FilterReducer, getInitialFilterState} from './FilterReducer';
import {QuickFilterAutocomplete} from './QuickFilterAutocomplete';
import {
  getRecurringPaymentExecutionQuickFilter,
  getRecurringPaymentStatusQuickFilter,
  getTransactionDateQuickFilterRange,
  isRecurringPaymentExecutionQuickFilterActive,
  isTransactionDateQuickFilterActive,
  type RecurringPaymentExecutionQuickFilter,
  type RecurringPaymentStatusQuickFilter,
  type TransactionDateQuickFilter,
} from './quickFilters';
import {QuickFilterSelect} from './QuickFilterSelect';

function clampDay(val: string): number | null {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(31, Math.max(1, n));
}

const transactionDateQuickFilterLabels: Record<TransactionDateQuickFilter, string> = {
  today: 'Today',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
};

const recurringPaymentStatusQuickFilterLabels: Record<RecurringPaymentStatusQuickFilter, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

const recurringPaymentExecutionQuickFilterLabels: Record<RecurringPaymentExecutionQuickFilter, string> = {
  executed: 'Executed',
  scheduled: 'Planned',
};

export type FilterWrapperProps = Pick<
  FilterDialogProps,
  'withCategories' | 'withRecurringPaymentStatus' | 'withExecuteDay' | 'withPaymentMethods' | 'withDateRange'
> & {
  currentFilters: Partial<EntityFilters>;
  onApply: (filters: Partial<EntityFilters>) => void;
  transactionDateQuickFilters?: TransactionDateQuickFilter[];
  recurringPaymentStatusQuickFilters?: RecurringPaymentStatusQuickFilter[];
  recurringPaymentExecutionQuickFilters?: RecurringPaymentExecutionQuickFilter[];
};

export const FilterWrapper: React.FC<FilterWrapperProps> = ({
  currentFilters,
  onApply,
  withRecurringPaymentStatus,
  withExecuteDay,
  withCategories,
  withPaymentMethods,
  withDateRange,
  transactionDateQuickFilters = [],
  recurringPaymentStatusQuickFilters = [],
  recurringPaymentExecutionQuickFilters = [],
}) => {
  const [open, setOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);
  const [state, dispatch] = React.useReducer(FilterReducer, getInitialFilterState());
  const [categoryOptions, setCategoryOptions] = React.useState<TCategoryVH[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = React.useState<TPaymentMethodVH[]>([]);
  const [categoryOptionsLoading, setCategoryOptionsLoading] = React.useState(false);
  const [paymentMethodOptionsLoading, setPaymentMethodOptionsLoading] = React.useState(false);

  const handleOpen = () => {
    // Bump key so FilterDialog remounts fresh (DateRangePicker re-reads defaultValue)
    setDialogKey(k => k + 1);
    // Seed simple fields from current URL/Redux filters
    dispatch({
      action: 'SET_DATE_RANGE',
      startDate: currentFilters.dateFrom ?? null,
      endDate: currentFilters.dateTo ?? null,
    });
    dispatch({action: 'SET_PAUSED', paused: currentFilters.paused ?? null});
    dispatch({
      action: 'SET_EXECUTE_FROM',
      executeFrom: currentFilters.executeFrom != null ? String(currentFilters.executeFrom) : '',
    });
    dispatch({
      action: 'SET_EXECUTE_TO',
      executeTo: currentFilters.executeTo != null ? String(currentFilters.executeTo) : '',
    });
    setOpen(true);
  };

  React.useEffect(() => {
    if (!withCategories) return;

    let ignoreResult = false;
    setCategoryOptionsLoading(true);
    void apiClient.backend.category.getValueHelp().then(([categories, error]) => {
      if (ignoreResult) return;
      setCategoryOptionsLoading(false);
      if (error) logger.error('Failed to fetch category options:', error);
      else setCategoryOptions(categories ?? []);
    });

    return () => {
      ignoreResult = true;
    };
  }, [withCategories]);

  React.useEffect(() => {
    if (!withPaymentMethods) return;

    let ignoreResult = false;
    setPaymentMethodOptionsLoading(true);
    void apiClient.backend.paymentMethod.getValueHelp().then(([paymentMethods, error]) => {
      if (ignoreResult) return;
      setPaymentMethodOptionsLoading(false);
      if (error) logger.error('Failed to fetch payment method options:', error);
      else setPaymentMethodOptions(paymentMethods ?? []);
    });

    return () => {
      ignoreResult = true;
    };
  }, [withPaymentMethods]);

  React.useEffect(() => {
    if (!open) return;
    dispatch({
      action: 'SET_CATEGORIES',
      categories: categoryOptions.filter(category => currentFilters.categories?.includes(category.id)),
    });
  }, [open, categoryOptions, currentFilters.categories]);

  React.useEffect(() => {
    if (!open) return;
    dispatch({
      action: 'SET_PAYMENT_METHODS',
      paymentMethods: paymentMethodOptions.filter(paymentMethod =>
        currentFilters.paymentMethods?.includes(paymentMethod.id),
      ),
    });
  }, [open, paymentMethodOptions, currentFilters.paymentMethods]);

  const onApplyFilters = () => {
    const result: Partial<EntityFilters> = {};
    if (withDateRange) {
      result.dateFrom = state.dateRange.startDate;
      result.dateTo = state.dateRange.endDate;
    }
    if (withRecurringPaymentStatus) {
      result.paused = state.paused;
    }
    if (withExecuteDay) {
      result.executeFrom = clampDay(state.executeFrom);
      result.executeTo = clampDay(state.executeTo);
    }
    if (withCategories) {
      result.categories = state.categories.map(c => c.id);
    }
    if (withPaymentMethods) {
      result.paymentMethods = state.paymentMethods.map(pm => pm.id);
    }
    onApply(result);
    setOpen(false);
  };

  const onFilterReset = () => {
    dispatch({action: 'RESET_ALL'});
    onApply({
      dateFrom: null,
      dateTo: null,
      paused: null,
      executeFrom: null,
      executeTo: null,
      categories: [],
      paymentMethods: [],
    });
    setOpen(false);
  };

  const hasActiveFilters = React.useMemo(() => {
    const hasDateRange = withDateRange && (!!currentFilters.dateFrom || !!currentFilters.dateTo);
    const hasStatus = withRecurringPaymentStatus && currentFilters.paused != null;
    const hasExecuteDay = withExecuteDay && (currentFilters.executeFrom != null || currentFilters.executeTo != null);
    const hasCategories = withCategories && (currentFilters.categories?.length ?? 0) > 0;
    const hasPaymentMethods = withPaymentMethods && (currentFilters.paymentMethods?.length ?? 0) > 0;
    return hasDateRange || hasStatus || hasExecuteDay || hasCategories || hasPaymentMethods;
  }, [currentFilters, withRecurringPaymentStatus, withExecuteDay, withDateRange, withCategories, withPaymentMethods]);

  const applyQuickFilter = (filterValues: Partial<EntityFilters>) => {
    onApply(filterValues);
  };

  const selectedTransactionDateQuickFilter =
    transactionDateQuickFilters.find(filter => isTransactionDateQuickFilterActive(filter, currentFilters)) ?? '';
  const selectedRecurringPaymentStatusQuickFilter =
    recurringPaymentStatusQuickFilters.find(filter => currentFilters.paused === (filter === 'inactive')) ?? '';
  const selectedRecurringPaymentExecutionQuickFilter =
    recurringPaymentExecutionQuickFilters.find(filter =>
      isRecurringPaymentExecutionQuickFilterActive(filter, currentFilters),
    ) ?? '';

  return (
    <Stack
      direction="row"
      gap={1}
      flexWrap="wrap"
      alignItems="center"
      sx={{py: 0.25, ml: 'auto', width: 'fit-content', maxWidth: '100%'}}
    >
      {transactionDateQuickFilters.length > 0 && (
        <QuickFilterSelect
          label="Time period"
          resetLabel="All dates"
          value={selectedTransactionDateQuickFilter}
          options={transactionDateQuickFilters.map(filter => ({
            value: filter,
            label: transactionDateQuickFilterLabels[filter],
          }))}
          width={176}
          onChange={filter =>
            applyQuickFilter(
              filter
                ? getTransactionDateQuickFilterRange(filter as TransactionDateQuickFilter)
                : {dateFrom: null, dateTo: null},
            )
          }
        />
      )}
      {recurringPaymentStatusQuickFilters.length > 0 && (
        <QuickFilterSelect
          label="Status"
          resetLabel="All statuses"
          value={selectedRecurringPaymentStatusQuickFilter}
          options={recurringPaymentStatusQuickFilters.map(filter => ({
            value: filter,
            label: recurringPaymentStatusQuickFilterLabels[filter],
          }))}
          width={148}
          onChange={filter =>
            applyQuickFilter(
              filter
                ? getRecurringPaymentStatusQuickFilter(filter as RecurringPaymentStatusQuickFilter)
                : {paused: null},
            )
          }
        />
      )}
      {recurringPaymentExecutionQuickFilters.length > 0 && (
        <QuickFilterSelect
          label="Execution"
          resetLabel="All executions"
          value={selectedRecurringPaymentExecutionQuickFilter}
          options={recurringPaymentExecutionQuickFilters.map(filter => ({
            value: filter,
            label: recurringPaymentExecutionQuickFilterLabels[filter],
          }))}
          width={160}
          onChange={filter =>
            applyQuickFilter(
              filter
                ? getRecurringPaymentExecutionQuickFilter(filter as RecurringPaymentExecutionQuickFilter)
                : {executeFrom: null, executeTo: null},
            )
          }
        />
      )}
      {withCategories && (
        <QuickFilterAutocomplete
          label="Category"
          value={currentFilters.categories ?? []}
          options={categoryOptions.map(category => ({id: category.id, label: category.name}))}
          loading={categoryOptionsLoading}
          width={184}
          onChange={categories => applyQuickFilter({categories})}
        />
      )}
      {withPaymentMethods && (
        <QuickFilterAutocomplete
          label="Payment method"
          value={currentFilters.paymentMethods ?? []}
          options={paymentMethodOptions.map(paymentMethod => ({id: paymentMethod.id, label: paymentMethod.name}))}
          loading={paymentMethodOptionsLoading}
          width={216}
          onChange={paymentMethods => applyQuickFilter({paymentMethods})}
        />
      )}
      <FilterButton isActive={hasActiveFilters} onClick={handleOpen} />
      <FilterDialog
        key={dialogKey}
        open={open}
        onClose={() => setOpen(false)}
        onReset={onFilterReset}
        onApply={onApplyFilters}
        withDateRange={withDateRange}
        withRecurringPaymentStatus={withRecurringPaymentStatus}
        withExecuteDay={withExecuteDay}
        withCategories={withCategories}
        withPaymentMethods={withPaymentMethods}
        state={state}
        dispatch={dispatch}
        categoryOptions={categoryOptions}
        paymentMethodOptions={paymentMethodOptions}
      />
    </Stack>
  );
};
