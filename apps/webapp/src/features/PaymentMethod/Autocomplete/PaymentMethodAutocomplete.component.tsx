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
import {usePaymentMethods} from '@/features/PaymentMethod';
import {type TPaymentMethod_VH} from '@/newTypes';

export type TPaymentMethodAutocompleteOption = Pick<TPaymentMethod_VH, 'ID' | 'name'>;

export interface IPaymentMethodAutocompleteProps {
  value?: TPaymentMethodAutocompleteOption | null;
  defaultValue?: TPaymentMethodAutocompleteOption | null;
  onChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: TPaymentMethodAutocompleteOption | null,
    reason: AutocompleteChangeReason,
  ) => void;
  textFieldProps?: TextFieldProps;
}

const filter = createFilterOptions<TPaymentMethodAutocompleteOption>();

/**
 * Applies a filter to the category options.
 *
 * @param options The category options to filter.
 */
export function applyPaymentMethodOptionsFilter(
  options: TPaymentMethodAutocompleteOption[],
  state: FilterOptionsState<TPaymentMethodAutocompleteOption>,
): TPaymentMethodAutocompleteOption[] {
  if (state.inputValue.length < 1) return options;
  const filtered = filter(options, state);
  const matches = filtered.filter(option => option.name.toLowerCase().includes(state.inputValue.toLowerCase()));
  return matches;
}

export const PaymentMethodAutocomplete: React.FC<IPaymentMethodAutocompleteProps> = ({
  value,
  defaultValue,
  onChange,
  textFieldProps,
}) => {
  const {isLoading, getValueHelps} = usePaymentMethods();

  const options: TPaymentMethodAutocompleteOption[] = React.useMemo(() => {
    return getValueHelps().map(({ID, name}) => ({ID, name}));
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
      filterOptions={applyPaymentMethodOptionsFilter}
      // FIXME:
      isOptionEqualToValue={(option, value) => option.ID === value?.ID || typeof value === 'string'}
      defaultValue={defaultValue}
      loadingText="Loading..."
      loading={isLoading}
      selectOnFocus
      autoHighlight
      renderInput={params => <TextField label="Payment Method" {...textFieldProps} {...params} />}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} key={option.ID} selected={selected}>
          {option.name}
        </StyledAutocompleteOption>
      )}
    />
  );
};
