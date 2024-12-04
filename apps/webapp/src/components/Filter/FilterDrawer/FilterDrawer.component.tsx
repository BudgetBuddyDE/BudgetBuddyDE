import {type TCategory, type TPaymentMethod} from '@budgetbuddyde/types';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import React from 'react';

import {DateRange, type TDateRangeProps} from '@/components/Base/Input';
import {FormDrawer} from '@/components/Drawer';
import {CreateCategoryAlert, useCategories} from '@/features/Category';
import {CreatePaymentMethodAlert, usePaymentMethods} from '@/features/PaymentMethod';
import {isRunningOnIOs} from '@/utils';

import {DEFAULT_FILTERS, useFilterStore} from '../Filter.store';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

interface IFilterDrawerHandler {
  onDateRangeChange: TDateRangeProps['onDateChange'];
  onCategoriesChange: (event: SelectChangeEvent<TCategory['id'][]>) => void;
  onRemoveCategory: (categoryId: TCategory['id']) => void;
  onPaymentMethodsChange: (event: SelectChangeEvent<TPaymentMethod['id'][]>) => void;
  onRemovePaymentMethod: (paymentMethodId: TPaymentMethod['id']) => void;
  onPriceFromChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPriceToChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetFilters: () => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export type TFilterDrawerProps = {};

export const FilterDrawer: React.FC<TFilterDrawerProps> = () => {
  const {data: categories, isLoading: isLoadingCategories} = useCategories();
  const {data: paymentMethods, isLoading: isLoading} = usePaymentMethods();
  const {show: showFilterDrawer, filters, setFilters, toggleVisibility} = useFilterStore();
  const [unappliedFilters, setUnappliedFilters] = React.useState(filters);

  const handler: IFilterDrawerHandler = {
    onDateRangeChange(dateRange) {
      setUnappliedFilters(prev => ({...prev, ...dateRange}));
    },
    onCategoriesChange(event) {
      const value = event.target.value;
      const selectedCategories: TCategory['id'][] = Array.isArray(value) ? value : [value];
      setUnappliedFilters(prev => ({...prev, categories: selectedCategories}));
    },
    onRemoveCategory(categoryId) {
      if (!unappliedFilters.categories) return;
      const updatedCategories = unappliedFilters.categories.filter(id => id !== categoryId);
      setUnappliedFilters(prev => ({...prev, categories: updatedCategories}));
    },
    onPaymentMethodsChange(event) {
      const value = event.target.value;
      const selectedPaymentMethods: TPaymentMethod['id'][] = Array.isArray(value) ? value : [value];
      setUnappliedFilters(prev => ({...prev, paymentMethods: selectedPaymentMethods}));
    },
    onRemovePaymentMethod(paymentMethodId) {
      if (!unappliedFilters.paymentMethods) return;
      const updatedPaymentMethods = unappliedFilters.paymentMethods.filter(id => id !== paymentMethodId);
      setUnappliedFilters(prev => ({...prev, paymentMethods: updatedPaymentMethods}));
    },
    onPriceFromChange(event) {
      setUnappliedFilters(prev => ({...prev, priceFrom: Number(event.target.value)}));
    },
    onPriceToChange(event) {
      setUnappliedFilters(prev => ({...prev, priceTo: Number(event.target.value)}));
    },
    onResetFilters() {
      setUnappliedFilters(DEFAULT_FILTERS);
    },
    onClose() {
      toggleVisibility();
    },
    onSubmit(event) {
      event.preventDefault();
      setFilters(unappliedFilters);
      handler.onClose();
    },
  };

  React.useEffect(() => {
    setUnappliedFilters(filters);
  }, [filters]);

  return (
    <FormDrawer
      open={showFilterDrawer}
      onClose={handler.onClose}
      onSubmit={handler.onSubmit}
      heading="Filters"
      closeOnBackdropClick>
      <Box sx={{mb: 2}}>
        <DateRange
          onDateChange={handler.onDateRangeChange}
          defaultStartDate={unappliedFilters.startDate ?? new Date()}
          defaultEndDate={unappliedFilters.endDate ?? new Date()}
        />
      </Box>

      {!isLoadingCategories && (categories ?? []).length > 0 ? (
        <FormControl fullWidth sx={{mb: 2}}>
          <InputLabel id="filter-category-label">Category</InputLabel>
          <Select
            labelId="filter-category-label"
            multiple
            value={unappliedFilters.categories ?? []}
            onChange={handler.onCategoriesChange}
            input={<OutlinedInput id="filter-category" label="Category" />}
            renderValue={selected => (
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                {selected.map(categoryId => {
                  const matchedCategory = (categories ?? []).find(category => category.id === categoryId);
                  if (!matchedCategory) return null;
                  return (
                    <Chip
                      key={matchedCategory.id}
                      label={matchedCategory.name}
                      onDelete={() => handler.onRemoveCategory(categoryId)}
                      // In order to make chips deletable we need to cancel the mouse-down event
                      onMouseDown={event => event.stopPropagation()}
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={MenuProps}>
            {(categories ?? []).map(category => {
              const selected =
                Array.isArray(unappliedFilters.categories) && unappliedFilters.categories.includes(category.id);
              return (
                <MenuItem
                  key={category.id}
                  value={category.id}
                  sx={{
                    fontWeight: theme =>
                      selected ? theme.typography.fontWeightBold : theme.typography.fontWeightRegular,
                    backgroundColor: theme => (selected ? theme.palette.action.selected : 'unset'),
                  }}>
                  {category.name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      ) : (
        <CreateCategoryAlert sx={{mb: 2}} />
      )}

      {!isLoading && (paymentMethods ?? []).length > 0 ? (
        <FormControl fullWidth sx={{mb: 2}}>
          <InputLabel id="filter-payment-method-label">Payment Method</InputLabel>
          <Select
            labelId="filter-payment-method-label"
            multiple
            value={unappliedFilters.paymentMethods ?? []}
            onChange={handler.onPaymentMethodsChange}
            input={<OutlinedInput id="filter-paymnet-method" label="Payment Method" />}
            renderValue={selected => (
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                {selected.map(paymentMethodId => {
                  const matchedPaymentMethod = (paymentMethods ?? []).find(
                    paymentMethod => paymentMethod.id === paymentMethodId,
                  );
                  if (!matchedPaymentMethod) return null;
                  return (
                    <Chip
                      key={matchedPaymentMethod.id}
                      label={matchedPaymentMethod.name}
                      onDelete={() => handler.onRemovePaymentMethod(paymentMethodId)}
                      // In order to make chips deletable we need to cancel the mouse-down event
                      onMouseDown={event => event.stopPropagation()}
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={MenuProps}>
            {(paymentMethods ?? []).map(paymentMethod => {
              const selected =
                Array.isArray(unappliedFilters.paymentMethods) &&
                unappliedFilters.paymentMethods.includes(paymentMethod.id);
              return (
                <MenuItem
                  key={paymentMethod.id}
                  value={paymentMethod.id}
                  sx={{
                    fontWeight: theme =>
                      selected ? theme.typography.fontWeightBold : theme.typography.fontWeightRegular,
                    backgroundColor: theme => (selected ? theme.palette.action.selected : 'unset'),
                  }}>
                  {paymentMethod.name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      ) : (
        <CreatePaymentMethodAlert sx={{mb: 2}} />
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '1rem',
          mb: 2,
        }}>
        <FormControl sx={{width: 'calc(50% - 0.5rem)'}}>
          <InputLabel htmlFor="filter-start-amount">Start</InputLabel>
          <OutlinedInput
            id="filter-start-amount"
            label="Start"
            name="priceFrom"
            type="number"
            inputProps={{inputMode: isRunningOnIOs() ? 'text' : 'numeric'}}
            value={unappliedFilters.priceFrom}
            onChange={handler.onPriceFromChange}
            startAdornment={<InputAdornment position="start">€</InputAdornment>}
          />
        </FormControl>
        <FormControl sx={{width: 'calc(50% - 0.5rem)'}}>
          <InputLabel htmlFor="filter-end-amount">End</InputLabel>
          <OutlinedInput
            id="filter-end-amount"
            label="End"
            name="priceTo"
            type="number"
            inputProps={{inputMode: isRunningOnIOs() ? 'text' : 'numeric'}}
            onChange={handler.onPriceToChange}
            value={unappliedFilters.priceTo}
            startAdornment={<InputAdornment position="start">€</InputAdornment>}
          />
        </FormControl>
      </Box>

      <Button onClick={handler.onResetFilters}>Reset filters</Button>
    </FormDrawer>
  );
};
