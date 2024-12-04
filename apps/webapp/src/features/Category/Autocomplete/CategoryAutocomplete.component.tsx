import {type TCategory} from '@budgetbuddyde/types';
import {
  Autocomplete,
  type AutocompleteChangeReason,
  type FilterOptionsState,
  TextField,
  type TextFieldProps,
  createFilterOptions,
} from '@mui/material';
import React from 'react';

import {StyledAutocompleteOption} from '@/components/Base/Input';
import {useTransactions} from '@/features/Transaction';

import {CategoryService} from '../CategoryService';
import {useCategories} from '../useCategories.hook';

export type TCategoryAutocompleteOption = {
  label: TCategory['name'];
  id: TCategory['id'];
};

export interface ICategoryAutocompleteProps {
  value?: TCategoryAutocompleteOption | null;
  defaultValue?: TCategoryAutocompleteOption | null;
  onChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: TCategoryAutocompleteOption | null,
    reason: AutocompleteChangeReason,
  ) => void;
  textFieldProps?: TextFieldProps;
}

const filter = createFilterOptions<TCategoryAutocompleteOption>();

/**
 * Applies a filter to the category options.
 *
 * @param options The category options to filter.
 */
export function applyCategoryOptionsFilter(
  options: TCategoryAutocompleteOption[],
  state: FilterOptionsState<TCategoryAutocompleteOption>,
): TCategoryAutocompleteOption[] {
  if (state.inputValue.length < 1) return options;
  const filtered = filter(options, state);
  const matches = filtered.filter(option => option.label.toLowerCase().includes(state.inputValue.toLowerCase()));
  return matches;
}

export const CategoryAutocomplete: React.FC<ICategoryAutocompleteProps> = ({
  value,
  defaultValue,
  onChange,
  textFieldProps,
}) => {
  const {isLoading: isLoadingTransactions, data: transactions} = useTransactions();
  const {isLoading: isLoadingCategories, data: categories} = useCategories();

  const options: TCategoryAutocompleteOption[] = React.useMemo(() => {
    if (!categories) return [];
    return CategoryService.sortAutocompleteOptionsByTransactionUsage(categories, transactions ?? []);
  }, [transactions, categories]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => {
        if (typeof option === 'string') return option;
        return option.label;
      }}
      value={value}
      onChange={onChange}
      filterOptions={applyCategoryOptionsFilter}
      // FIXME:
      isOptionEqualToValue={(option, value) => option.id === value?.id || typeof value === 'string'}
      defaultValue={defaultValue}
      loadingText="Loading..."
      loading={isLoadingCategories || isLoadingTransactions}
      selectOnFocus
      autoHighlight
      renderInput={params => <TextField label="Category" {...textFieldProps} {...params} />}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} key={option.id} selected={selected}>
          {option.label}
        </StyledAutocompleteOption>
      )}
    />
  );
};
