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
import {use} from '@/hooks/use';
import {type TCategory_VH} from '@/newTypes';

import {useCategories} from '../useCategories.hook';

export type TCategoryAutocompleteOption = Omit<TCategory_VH, 'description'>;

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
  const matches = filtered.filter(option => option.name.toLowerCase().includes(state.inputValue.toLowerCase()));
  return matches;
}

export const CategoryAutocomplete: React.FC<ICategoryAutocompleteProps> = ({
  value,
  defaultValue,
  onChange,
  textFieldProps,
}) => {
  const {getValueHelps} = useCategories();
  const {isLoading, result} = use(() => getValueHelps());

  const options: TCategoryAutocompleteOption[] = React.useMemo(() => {
    if (!result) return [];
    return result;
  }, [getValueHelps]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => {
        if (typeof option === 'string') return option;
        return option.name;
      }}
      value={value}
      onChange={onChange}
      filterOptions={applyCategoryOptionsFilter}
      // FIXME:
      isOptionEqualToValue={(option, value) => option.ID === value?.ID || typeof value === 'string'}
      defaultValue={defaultValue}
      loadingText="Loading..."
      loading={isLoading}
      selectOnFocus
      autoHighlight
      renderInput={params => <TextField label="Category" {...textFieldProps} {...params} />}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} key={option.ID} selected={selected}>
          {option.name}
        </StyledAutocompleteOption>
      )}
    />
  );
};
