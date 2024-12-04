import {type TStockExchange} from '@budgetbuddyde/types';
import {
  Autocomplete,
  type AutocompleteChangeReason,
  Box,
  FilterOptionsState,
  TextField,
  type TextFieldProps,
  Typography,
} from '@mui/material';

import {StyledAutocompleteOption} from '@/components/Base/Input';

import {useStockExchanges} from '../useStockExchanges.hook';

export type TStockExchangeAutocompleteOption = {
  value: TStockExchange['id'];
  label: TStockExchange['name'];
  ticker: TStockExchange['symbol'];
};

export interface IStockExchangeAutocompleteProps {
  value?: TStockExchangeAutocompleteOption | null;
  defaultValue?: TStockExchangeAutocompleteOption | null;
  onChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: TStockExchangeAutocompleteOption | null,
    reason: AutocompleteChangeReason,
  ) => void;
  textFieldProps?: TextFieldProps;
}

/**
 * Applies a filter to the stock exchange options based on the provided state.
 *
 * @param options - The array of stock exchange options to filter.
 * @param state - The filter options state to apply.
 * @returns The filtered array of stock exchange options.
 */
export function applyStockExchangeOptionsFilter(
  options: TStockExchangeAutocompleteOption[],
  state: FilterOptionsState<TStockExchangeAutocompleteOption>,
): TStockExchangeAutocompleteOption[] {
  return options.filter(
    option =>
      option.label.toLowerCase().includes(state.inputValue.toLowerCase()) ||
      option.ticker.toLowerCase().includes(state.inputValue.toLowerCase()),
  );
}

export const StockExchangeAutocomplete: React.FC<IStockExchangeAutocompleteProps> = ({
  value,
  defaultValue,
  onChange,
  textFieldProps,
}) => {
  const {isLoading: isLoadingStockExchanges, selectOptions, error} = useStockExchanges();

  return (
    <Autocomplete
      options={selectOptions}
      getOptionLabel={option => {
        if (typeof option === 'string') return option;
        return option.label;
      }}
      value={value}
      filterOptions={applyStockExchangeOptionsFilter}
      onChange={onChange}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      defaultValue={defaultValue}
      loadingText="Loading..."
      loading={isLoadingStockExchanges}
      selectOnFocus
      autoHighlight
      renderInput={params => (
        <TextField
          label="Category"
          {...textFieldProps}
          error={error !== null}
          helperText={error?.message}
          {...params}
        />
      )}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} key={option.value} selected={selected}>
          <Box>
            <Typography variant="body1">{option.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {option.ticker}
            </Typography>
          </Box>
        </StyledAutocompleteOption>
      )}
    />
  );
};
