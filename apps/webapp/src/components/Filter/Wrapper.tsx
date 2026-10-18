'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {Stack} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Autocomplete} from '@/components/Form/Autocomplete';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {logger} from '@/logger';
import {FilterButton} from './FilterButton';
import {FilterDialog, type FilterDialogProps} from './FilterDialog';
import {FilterReducer, getInitialFilterState} from './FilterReducer';
import {
  getRecurringPaymentStatusQuickFilter,
  getTransactionDateQuickFilterRange,
  isTransactionDateQuickFilterActive,
  type RecurringPaymentStatusQuickFilter,
  type TransactionDateQuickFilter,
} from './quickFilters';

export type FilterWrapperProps = Pick<
  FilterDialogProps,
  'withCategories' | 'withRecurringPaymentStatus' | 'withPaymentMethods' | 'withDateRange'
> & {
  currentFilters: Partial<EntityFilters>;
  onApply: (filters: Partial<EntityFilters>) => void;
  transactionDateQuickFilters?: TransactionDateQuickFilter[];
  recurringPaymentStatusQuickFilters?: RecurringPaymentStatusQuickFilter[];
};

export const FilterWrapper: React.FC<FilterWrapperProps> = ({
  currentFilters,
  onApply,
  withRecurringPaymentStatus,
  withCategories,
  withPaymentMethods,
  withDateRange,
  transactionDateQuickFilters = [],
  recurringPaymentStatusQuickFilters = [],
}) => {
  const t = useAppTranslations();
  const transactionDateQuickFilterLabels: Record<TransactionDateQuickFilter, string> = {
    today: t('table.today'),
    thisWeek: t('table.thisWeek'),
    thisMonth: t('table.thisMonth'),
    lastMonth: t('table.lastMonth'),
  };

  const recurringPaymentStatusQuickFilterLabels: Record<RecurringPaymentStatusQuickFilter, string> = {
    active: t('table.active'),
    inactive: t('table.inactive'),
  };

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
    dispatch({action: 'SET_PAUSED', paused: currentFilters.paused ?? null});
    setOpen(true);
  };

  React.useEffect(() => {
    if (!withCategories) return;

    let ignoreResult = false;
    void apiClient.backend.category.getValueHelp().then(([categories, error]) => {
      if (ignoreResult) return;
      if (error) logger.error('Failed to fetch category options', error);
      else setCategoryOptions(categories ?? []);
    });

    return () => {
      ignoreResult = true;
    };
  }, [withCategories]);

  React.useEffect(() => {
    if (!withPaymentMethods) return;

    let ignoreResult = false;
    void apiClient.backend.paymentMethod.getValueHelp().then(([paymentMethods, error]) => {
      if (ignoreResult) return;
      if (error) logger.error('Failed to fetch payment method options', error);
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
      categories: [],
      paymentMethods: [],
    });
    setOpen(false);
  };

  const hasActiveFilters = React.useMemo(() => {
    const hasDateRange = withDateRange && (!!currentFilters.dateFrom || !!currentFilters.dateTo);
    const hasStatus = withRecurringPaymentStatus && currentFilters.paused != null;
    const hasCategories = withCategories && (currentFilters.categories?.length ?? 0) > 0;
    const hasPaymentMethods = withPaymentMethods && (currentFilters.paymentMethods?.length ?? 0) > 0;
    return hasDateRange || hasStatus || hasCategories || hasPaymentMethods;
  }, [currentFilters, withRecurringPaymentStatus, withDateRange, withCategories, withPaymentMethods]);

  const applyQuickFilter = (filterValues: Partial<EntityFilters>) => {
    onApply(filterValues);
  };

  const selectedTransactionDateQuickFilter =
    transactionDateQuickFilters.find(filter => isTransactionDateQuickFilterActive(filter, currentFilters)) ?? '';
  const selectedRecurringPaymentStatusQuickFilter =
    recurringPaymentStatusQuickFilters.find(filter => currentFilters.paused === (filter === 'inactive')) ?? '';

  return (
    <Stack
      direction="row"
      sx={{
        gap: 1,
        flexWrap: 'wrap',
        alignItems: 'center',
        py: 0.25,
        ml: 'auto',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      {transactionDateQuickFilters.length > 0 && (
        <Autocomplete<TransactionDateQuickFilter>
          name="filter-date-range"
          label={t('table.timePeriod')}
          size="small"
          searchAsYouType={false}
          retrieveOptionsFunc={() => transactionDateQuickFilters}
          value={selectedTransactionDateQuickFilter || null}
          onChange={(_, filter) =>
            applyQuickFilter(filter ? getTransactionDateQuickFilterRange(filter) : {dateFrom: null, dateTo: null})
          }
          getOptionLabel={filter => transactionDateQuickFilterLabels[filter]}
          noOptionsText={t('table.noTimePeriodsFound')}
          sx={{width: 176, minWidth: 0}}
        />
      )}
      {recurringPaymentStatusQuickFilters.length > 0 && (
        <Autocomplete<RecurringPaymentStatusQuickFilter>
          name="filter-recurring-payment-status"
          label={t('table.status')}
          size="small"
          searchAsYouType={false}
          retrieveOptionsFunc={() => recurringPaymentStatusQuickFilters}
          value={selectedRecurringPaymentStatusQuickFilter || null}
          onChange={(_, filter) =>
            applyQuickFilter(filter ? getRecurringPaymentStatusQuickFilter(filter) : {paused: null})
          }
          getOptionLabel={filter => recurringPaymentStatusQuickFilterLabels[filter]}
          noOptionsText={t('table.noStatusesFound')}
          sx={{width: 148, minWidth: 0}}
        />
      )}
      {withCategories && (
        <Autocomplete<TCategoryVH, true>
          name="filter-categories"
          label={t('table.category')}
          placeholder={t('table.anyCategory')}
          multiple
          disableCloseOnSelect
          size="small"
          searchAsYouType={false}
          retrieveOptionsFunc={() => categoryOptions}
          value={categoryOptions.filter(category => currentFilters.categories?.includes(category.id))}
          onChange={(_, categories) => applyQuickFilter({categories: categories.map(category => category.id)})}
          getOptionLabel={category => category.name}
          isOptionEqualToValue={(category, value) => category.id === value.id}
          noOptionsText={t('table.noCategoriesFound')}
          sx={{width: 184, minWidth: 0}}
        />
      )}
      {withPaymentMethods && (
        <Autocomplete<TPaymentMethodVH, true>
          name="filter-payment-methods"
          label={t('table.paymentMethod')}
          placeholder={t('table.anyPaymentMethod')}
          multiple
          disableCloseOnSelect
          size="small"
          searchAsYouType={false}
          retrieveOptionsFunc={() => paymentMethodOptions}
          value={paymentMethodOptions.filter(paymentMethod =>
            currentFilters.paymentMethods?.includes(paymentMethod.id),
          )}
          onChange={(_, paymentMethods) =>
            applyQuickFilter({paymentMethods: paymentMethods.map(paymentMethod => paymentMethod.id)})
          }
          getOptionLabel={paymentMethod => paymentMethod.name}
          isOptionEqualToValue={(paymentMethod, value) => paymentMethod.id === value.id}
          noOptionsText={t('table.noPaymentMethodsFound')}
          sx={{width: 216, minWidth: 0}}
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
