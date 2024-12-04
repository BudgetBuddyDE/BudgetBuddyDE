import {type TPaymentMethod} from '@budgetbuddyde/types';
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
import {PaymentMethodService, usePaymentMethods} from '@/features/PaymentMethod';
import {useTransactions} from '@/features/Transaction';

export type TPaymentMethodAutocompleteOption = {
  label: TPaymentMethod['name'];
  id: TPaymentMethod['id'];
};

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
  const matches = filtered.filter(option => option.label.toLowerCase().includes(state.inputValue.toLowerCase()));
  return matches;
}

export const PaymentMethodAutocomplete: React.FC<IPaymentMethodAutocompleteProps> = ({
  value,
  defaultValue,
  onChange,
  textFieldProps,
}) => {
  const {isLoading: isLoadingTransactions, data: transactions} = useTransactions();
  const {isLoading: isLoadingPaymentMethods, data: paymentMethods} = usePaymentMethods();

  const options: TPaymentMethodAutocompleteOption[] = React.useMemo(() => {
    return PaymentMethodService.sortAutocompleteOptionsByTransactionUsage(paymentMethods ?? [], transactions ?? []);
  }, [transactions, paymentMethods]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => {
        if (typeof option === 'string') return option;
        return option.label;
      }}
      value={value}
      onChange={onChange}
      filterOptions={applyPaymentMethodOptionsFilter}
      // FIXME:
      isOptionEqualToValue={(option, value) => option.id === value?.id || typeof value === 'string'}
      defaultValue={defaultValue}
      loadingText="Loading..."
      loading={isLoadingPaymentMethods || isLoadingTransactions}
      selectOnFocus
      autoHighlight
      renderInput={params => <TextField label="Payment Method" {...textFieldProps} {...params} />}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} key={option.id} selected={selected}>
          {option.label}
        </StyledAutocompleteOption>
      )}
    />
  );
};
