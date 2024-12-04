import {
  Autocomplete,
  AutocompleteChangeReason,
  FilterOptionsState,
  TextField,
  type TextFieldProps,
  createFilterOptions,
} from '@mui/material';
import React from 'react';

import {StyledAutocompleteOption} from '@/components/Base/Input';
import {useTransactions} from '@/features/Transaction';

export type TReceiverAutocompleteOption = {
  label: string;
  value: string;
};

export interface IReceiverAutocompleteProps {
  value?: TReceiverAutocompleteOption | null;
  defaultValue?: TReceiverAutocompleteOption | null;
  onChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: TReceiverAutocompleteOption | null,
    reason: AutocompleteChangeReason,
  ) => void;
  textFieldProps?: TextFieldProps;
}

const filter = createFilterOptions<TReceiverAutocompleteOption>();

export function applyReceiverOptionsFilter(
  options: TReceiverAutocompleteOption[],
  state: FilterOptionsState<TReceiverAutocompleteOption>,
): TReceiverAutocompleteOption[] {
  if (state.inputValue.length < 1) return options;
  const filtered = filter(options, state);
  if (filtered.length > 0) {
    const doesOptionExist = filtered.find(match => match.label === state.inputValue) !== undefined;
    return doesOptionExist ? filtered : [{label: `Create "${state.inputValue}"`, value: state.inputValue}, ...filtered];
  } else return [{label: `Add "${state.inputValue}"`, value: state.inputValue}];
}

export const ReceiverAutocomplete: React.FC<IReceiverAutocompleteProps> = ({
  value,
  defaultValue,
  onChange,
  textFieldProps,
}) => {
  const {isLoading: isLoadingTransactions, data: transactions} = useTransactions();

  const options: TReceiverAutocompleteOption[] = React.useMemo(() => {
    if (!transactions) return [];
    return Array.from(new Set(transactions.map(({receiver}) => receiver))).map(
      receiver =>
        ({
          label: receiver,
          value: receiver,
        }) as TReceiverAutocompleteOption,
    );
  }, [transactions]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => {
        if (typeof option === 'string') return option;
        if (option.value) return option.value;
        return option.label;
      }}
      value={value}
      onChange={onChange}
      filterOptions={applyReceiverOptionsFilter}
      isOptionEqualToValue={(option, value) => option.value == value.value && option.label == value.label}
      defaultValue={defaultValue}
      loadingText="Loading..."
      loading={isLoadingTransactions}
      selectOnFocus
      autoHighlight
      renderInput={params => <TextField label="Receiver" {...textFieldProps} {...params} />}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} selected={selected}>
          {option.label}
        </StyledAutocompleteOption>
      )}
    />
  );
};
