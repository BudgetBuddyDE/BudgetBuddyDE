'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import React from 'react';
import {apiClient} from '@/apiClient';
import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {logger} from '@/logger';
import {FilterButton} from './FilterButton';
import {FilterDialog, type FilterDialogProps} from './FilterDialog';
import {FilterReducer, getInitialFilterState} from './FilterReducer';

function clampDay(val: string): number | null {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(31, Math.max(1, n));
}

export type FilterWrapperProps = Pick<
  FilterDialogProps,
  'withCategories' | 'withExecuteDay' | 'withPaymentMethods' | 'withDateRange'
> & {
  currentFilters: Partial<EntityFilters>;
  onApply: (filters: Partial<EntityFilters>) => void;
};

export const FilterWrapper: React.FC<FilterWrapperProps> = ({
  currentFilters,
  onApply,
  withExecuteDay,
  withCategories,
  withPaymentMethods,
  withDateRange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);
  const [state, dispatch] = React.useReducer(FilterReducer, getInitialFilterState());
  const [categoryOptions, setCategoryOptions] = React.useState<TCategoryVH[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = React.useState<TPaymentMethodVH[]>([]);

  const handleOpen = () => {
    // Bump key so FilterDialog remounts fresh (DateRangePicker re-reads defaultValue)
    setDialogKey(k => k + 1);
    // Seed simple fields from current URL/Redux filters
    dispatch({
      action: 'SET_DATE_RANGE',
      startDate: currentFilters.dateFrom ?? null,
      endDate: currentFilters.dateTo ?? null,
    });
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
    if (!open) return;
    Promise.all([apiClient.backend.category.getValueHelp(), apiClient.backend.paymentMethod.getValueHelp()]).then(
      ([[cats, catErr], [pms, pmErr]]) => {
        if (catErr) logger.error('Failed to fetch category options:', catErr);
        else {
          setCategoryOptions(cats ?? []);
          dispatch({
            action: 'SET_CATEGORIES',
            categories: (cats ?? []).filter(c => currentFilters.categories?.includes(c.id)),
          });
        }
        if (pmErr) logger.error('Failed to fetch payment method options:', pmErr);
        else {
          setPaymentMethodOptions(pms ?? []);
          dispatch({
            action: 'SET_PAYMENT_METHODS',
            paymentMethods: (pms ?? []).filter(pm => currentFilters.paymentMethods?.includes(pm.id)),
          });
        }
      },
    );
  }, [open, currentFilters.categories?.includes, currentFilters.paymentMethods?.includes]); // eslint-disable-line react-hooks/exhaustive-deps

  const onApplyFilters = () => {
    const result: Partial<EntityFilters> = {};
    if (withDateRange) {
      result.dateFrom = state.dateRange.startDate;
      result.dateTo = state.dateRange.endDate;
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
    onApply({dateFrom: null, dateTo: null, executeFrom: null, executeTo: null, categories: [], paymentMethods: []});
    setOpen(false);
  };

  const hasActiveFilters = React.useMemo(() => {
    const hasDateRange = withDateRange && (!!currentFilters.dateFrom || !!currentFilters.dateTo);
    const hasExecuteDay = withExecuteDay && (currentFilters.executeFrom != null || currentFilters.executeTo != null);
    const hasCategories = withCategories && (currentFilters.categories?.length ?? 0) > 0;
    const hasPaymentMethods = withPaymentMethods && (currentFilters.paymentMethods?.length ?? 0) > 0;
    return hasDateRange || hasExecuteDay || hasCategories || hasPaymentMethods;
  }, [currentFilters, withExecuteDay, withDateRange, withCategories, withPaymentMethods]);

  return (
    <React.Fragment>
      <FilterButton isActive={hasActiveFilters} onClick={handleOpen} />
      <FilterDialog
        key={dialogKey}
        open={open}
        onClose={() => setOpen(false)}
        onReset={onFilterReset}
        onApply={onApplyFilters}
        withDateRange={withDateRange}
        withExecuteDay={withExecuteDay}
        withCategories={withCategories}
        withPaymentMethods={withPaymentMethods}
        state={state}
        dispatch={dispatch}
        categoryOptions={categoryOptions}
        paymentMethodOptions={paymentMethodOptions}
      />
    </React.Fragment>
  );
};
