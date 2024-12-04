import {type TAssetSearchResult} from '@budgetbuddyde/types';
import {
  Autocomplete,
  type AutocompleteChangeReason,
  Grid2 as Grid,
  TextField,
  type TextFieldProps,
  Typography,
} from '@mui/material';
import {debounce} from 'lodash';
import React from 'react';

import {Image} from '@/components/Base/Image';
import {StyledAutocompleteOption} from '@/components/Base/Input';
import {useSnackbarContext} from '@/features/Snackbar';

import {StockService} from '../StockService';

export type TStockAutocompleteOption = {
  /**
   * Company name
   */
  label: string;
  /**
   * ISIN
   */
  isin: string;
  logo: string;
  type: string;
};

export interface IStockAutocompleteProps {
  value?: TStockAutocompleteOption | null;
  defaultValue?: TStockAutocompleteOption | null;
  onChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: TStockAutocompleteOption | null,
    reason: AutocompleteChangeReason,
  ) => void;
  textFieldProps?: TextFieldProps;
}

export const StockAutocomplete: React.FC<IStockAutocompleteProps> = ({
  value,
  defaultValue,
  onChange,
  textFieldProps,
}) => {
  const {showSnackbar} = useSnackbarContext();
  const [isLoadingStocks, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<TAssetSearchResult[]>([]);

  const options: TStockAutocompleteOption[] = React.useMemo(() => {
    return searchResults
      .filter(result => result.type !== 'Crypto')
      .map(result => ({
        label: result.name,
        isin: result.identifier,
        logo: result.logo,
        type: result.type,
      }));
  }, [searchResults]);

  const searchStocks = async () => {
    if (searchTerm.length < 1) return setSearchResults([]);
    setLoading(true);
    try {
      const [matches, error] = await StockService.searchAsset(searchTerm);
      if (error) throw error;
      console.log(matches);
      if (!matches) return setSearchResults([]);
      setSearchResults(matches);
    } catch (err) {
      console.error(err);
      showSnackbar({message: 'Error fetching stocks'});
    }
    setLoading(false);
  };

  React.useLayoutEffect(() => {
    searchStocks();

    return () => {
      setLoading(false);
      setSearchTerm('');
    };
  }, [searchTerm]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => {
        if (typeof option === 'string') return option;
        return option.label;
      }}
      value={value}
      onChange={onChange}
      onInputChange={debounce((_event, value) => setSearchTerm(value), 400)}
      isOptionEqualToValue={(option, value) => option.isin === value.isin}
      defaultValue={defaultValue}
      loadingText="Loading..."
      loading={isLoadingStocks}
      selectOnFocus
      autoHighlight
      renderInput={params => <TextField label="Stock" {...textFieldProps} {...params} />}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} key={option.isin} selected={selected}>
          <Grid container alignItems="center">
            <Grid sx={{display: 'flex', width: '40px'}}>
              <Image src={option.logo} alt={option.label + ' logo'} sx={{width: '40px', height: '40px'}} />
            </Grid>
            <Grid sx={{width: 'calc(100% - 44px)', wordWrap: 'break-word', pl: 1}}>
              <Typography variant="body1">{option.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {option.type} - {option.isin}
              </Typography>
            </Grid>
          </Grid>
        </StyledAutocompleteOption>
      )}
    />
  );
};
