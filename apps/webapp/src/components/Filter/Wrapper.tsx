'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {logger} from '@/logger';
import {FilterButton} from './FilterButton';
import {FilterDialog, type FilterDialogProps} from './FilterDialog';
import {FilterReducer, getInitialFilterState} from './FilterReducer';

type TransactionRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth';
type RecurringActivityPreset = 'active' | 'inactive';
type RecurringSchedulePreset = 'executed' | 'planned';

function clampDay(val: string): number | null {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(31, Math.max(1, n));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function isSameDay(left: Date | null | undefined, right: Date) {
  if (!left) return false;
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function useStableStringArray(value: string[] | undefined) {
  const fallbackValue = value ?? [];
  const reference = React.useRef(fallbackValue);

  if (!areStringArraysEqual(reference.current, fallbackValue)) {
    reference.current = fallbackValue;
  }

  return reference.current;
}

function getTransactionDateRangePreset(
  preset: TransactionRangePreset,
  now: Date,
): Pick<EntityFilters, 'dateFrom' | 'dateTo'> {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (preset === 'today') {
    return {dateFrom: todayStart, dateTo: todayEnd};
  }
  if (preset === 'thisWeek') {
    const day = now.getDay();
    const offsetFromMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetFromMonday);
    return {dateFrom: startOfDay(start), dateTo: todayEnd};
  }
  if (preset === 'thisMonth') {
    return {dateFrom: new Date(now.getFullYear(), now.getMonth(), 1), dateTo: todayEnd};
  }

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return {dateFrom: previousMonthStart, dateTo: previousMonthEnd};
}

function determineTransactionDateRangePreset(
  filters: Partial<EntityFilters>,
  now: Date,
): TransactionRangePreset | null {
  if (!filters.dateFrom || !filters.dateTo) return null;

  const presets: TransactionRangePreset[] = ['today', 'thisWeek', 'thisMonth', 'lastMonth'];
  for (const preset of presets) {
    const range = getTransactionDateRangePreset(preset, now);
    if (isSameDay(filters.dateFrom, range.dateFrom as Date) && isSameDay(filters.dateTo, range.dateTo as Date)) {
      return preset;
    }
  }

  return null;
}

function determineRecurringActivityPreset(filters: Partial<EntityFilters>): RecurringActivityPreset | null {
  if (filters.paused === true) return 'inactive';
  if (filters.paused === false) return 'active';
  return null;
}

function determineRecurringSchedulePreset(filters: Partial<EntityFilters>, now: Date): RecurringSchedulePreset | null {
  const today = now.getDate();
  if (filters.executeFrom === today && filters.executeTo == null) return 'planned';
  if (today > 1 && filters.executeFrom == null && filters.executeTo === today - 1) return 'executed';
  return null;
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
  const stableCategories = useStableStringArray(currentFilters.categories);
  const stablePaymentMethods = useStableStringArray(currentFilters.paymentMethods);
  const selectedCategoryIds = React.useMemo(
    () => new Set(stableCategories),
    [stableCategories],
  );
  const selectedPaymentMethodIds = React.useMemo(
    () => new Set(stablePaymentMethods),
    [stablePaymentMethods],
  );
  const now = new Date();

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
    // Load options when the dialog is open and also pre-load them for quick-filter dropdowns.
    if (!open && !withCategories && !withPaymentMethods) return;
    Promise.all([apiClient.backend.category.getValueHelp(), apiClient.backend.paymentMethod.getValueHelp()]).then(
      ([[cats, catErr], [pms, pmErr]]) => {
        if (catErr) logger.error('Failed to fetch category options:', catErr);
        else {
          setCategoryOptions(cats ?? []);
          dispatch({
            action: 'SET_CATEGORIES',
            categories: (cats ?? []).filter(c => selectedCategoryIds.has(c.id)),
          });
        }
        if (pmErr) logger.error('Failed to fetch payment method options:', pmErr);
        else {
          setPaymentMethodOptions(pms ?? []);
          dispatch({
            action: 'SET_PAYMENT_METHODS',
            paymentMethods: (pms ?? []).filter(pm => selectedPaymentMethodIds.has(pm.id)),
          });
        }
      },
    );
  }, [open, withCategories, withPaymentMethods, selectedCategoryIds, selectedPaymentMethodIds]);

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
    onApply({
      dateFrom: null,
      dateTo: null,
      executeFrom: null,
      executeTo: null,
      paused: null,
      categories: [],
      paymentMethods: [],
    });
    setOpen(false);
  };

  const hasActiveFilters = React.useMemo(() => {
    const hasDateRange = withDateRange && (!!currentFilters.dateFrom || !!currentFilters.dateTo);
    const hasExecuteDay =
      withExecuteDay &&
      (currentFilters.executeFrom != null || currentFilters.executeTo != null || currentFilters.paused != null);
    const hasCategories = withCategories && (currentFilters.categories?.length ?? 0) > 0;
    const hasPaymentMethods = withPaymentMethods && (currentFilters.paymentMethods?.length ?? 0) > 0;
    return hasDateRange || hasExecuteDay || hasCategories || hasPaymentMethods;
  }, [currentFilters, withExecuteDay, withDateRange, withCategories, withPaymentMethods]);

  const selectedCategory = currentFilters.categories?.length === 1 ? currentFilters.categories[0] : '';
  const selectedPaymentMethod = currentFilters.paymentMethods?.length === 1 ? currentFilters.paymentMethods[0] : '';
  const transactionDateRangePreset = determineTransactionDateRangePreset(currentFilters, now);
  const recurringActivityPreset = determineRecurringActivityPreset(currentFilters);
  const recurringSchedulePreset = determineRecurringSchedulePreset(currentFilters, now);
  const today = now.getDate();

  return (
    <React.Fragment>
      <Stack direction="row" gap={1} sx={{alignItems: 'center', flexWrap: 'wrap'}}>
        {withDateRange && (
          <ToggleButtonGroup
            size="small"
            exclusive
            aria-label="Transaction period quick filter"
            value={transactionDateRangePreset}
            onChange={(_, value: TransactionRangePreset | null) => {
              if (!value) {
                onApply({dateFrom: null, dateTo: null});
                return;
              }
              onApply(getTransactionDateRangePreset(value, now));
            }}
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="thisWeek">This week</ToggleButton>
            <ToggleButton value="thisMonth">This month</ToggleButton>
            <ToggleButton value="lastMonth">Last month</ToggleButton>
          </ToggleButtonGroup>
        )}

        {withExecuteDay && (
          <ToggleButtonGroup
            size="small"
            exclusive
            aria-label="Recurring payment activity quick filter"
            value={recurringActivityPreset}
            onChange={(_, value: RecurringActivityPreset | null) => {
              onApply({paused: value === null ? null : value === 'inactive'});
            }}
          >
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="inactive">Inactive</ToggleButton>
          </ToggleButtonGroup>
        )}

        {withExecuteDay && (
          <ToggleButtonGroup
            size="small"
            exclusive
            aria-label="Recurring payment schedule quick filter"
            value={recurringSchedulePreset}
            onChange={(_, value: RecurringSchedulePreset | null) => {
              if (value === null) {
                onApply({executeFrom: null, executeTo: null});
                return;
              }
              if (value === 'planned') {
                onApply({executeFrom: today, executeTo: null});
                return;
              }
              onApply({executeFrom: null, executeTo: today > 1 ? today - 1 : null});
            }}
          >
            <ToggleButton value="executed" disabled={today === 1}>
              Executed
            </ToggleButton>
            <ToggleButton value="planned">Planned</ToggleButton>
          </ToggleButtonGroup>
        )}

        {withCategories && (
          <TextField
            select
            label="Category"
            size="small"
            value={selectedCategory}
            onChange={event => {
              onApply({categories: event.target.value ? [event.target.value] : []});
            }}
            sx={{minWidth: 160}}
          >
            <MenuItem value="">All categories</MenuItem>
            {categoryOptions.map(category => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {withPaymentMethods && (
          <TextField
            select
            label="Payment method"
            size="small"
            value={selectedPaymentMethod}
            onChange={event => {
              onApply({paymentMethods: event.target.value ? [event.target.value] : []});
            }}
            sx={{minWidth: 180}}
          >
            <MenuItem value="">All payment methods</MenuItem>
            {paymentMethodOptions.map(paymentMethod => (
              <MenuItem key={paymentMethod.id} value={paymentMethod.id}>
                {paymentMethod.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <FilterButton isActive={hasActiveFilters} onClick={handleOpen} />
      </Stack>
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
