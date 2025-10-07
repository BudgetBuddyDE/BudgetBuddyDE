'use client';

import debounce from 'lodash.debounce';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  TextField,
  Autocomplete as MuiAutocomplete,
  type AutocompleteProps as MuiAutocompleteProps,
  CircularProgress,
  type ChipTypeMap,
  type TextFieldProps,
} from '@mui/material';
import React from 'react';
import { useEnhancedEffect } from '@/hooks/useEnhancedEffect';
import { logger } from '@/logger';

export type AutocompleteProps<
  Value,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
  ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent']
> = Omit<
  MuiAutocompleteProps<Value, Multiple, DisableClearable, FreeSolo, ChipComponent>,
  'renderInput' | 'options' | 'loading' | 'open' | 'onOpen' | 'onClose'
> &
  Pick<TextFieldProps, 'error' | 'helperText'> & {
    label: string;
    name: string;
    required?: boolean;
    placeholder?: string;
    // REVISIT: Use an discriminated union type to enforce the correct usage of these props
    // Was implemented first but had some issues with linting
    searchAsYouType: boolean;
    // Only required when searchAsYouType is true
    filterOptions: (options: Value[]) => boolean;
    // Only required when searchAsYouType is true
    debounceInMillis?: number;
    // keywords will only be provided when searchAsYouType is true
    retrieveOptionsFunc: (keywords: string) => Promise<Value[]> | Value[];
    // type RetrieveOptionsFunc<ReturnType, WithKeyword extends boolean = false> = WithKeyword extends true
    //   ? (keywords: string) => Promise<ReturnType[]> | ReturnType[]
    //   : () => Promise<ReturnType[]> | ReturnType[];
  };

export const Autocomplete = <
  Value,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
  ChipComponent extends React.ElementType = ChipTypeMap['defaultComponent']
>({
  retrieveOptionsFunc,
  label,
  name,
  required = false,
  placeholder,
  error,
  helperText,
  defaultValue,
  renderOption,
  searchAsYouType = false,
  ...props
}: AutocompleteProps<Value, Multiple, DisableClearable, FreeSolo, ChipComponent>) => {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<readonly Value[]>([]);
  const [fetchError, setFetchError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const fetchOptions = React.useCallback(() => {
    try {
      setLoading(true);

      void (async () => {
        setLoading(true);
        if (retrieveOptionsFunc.constructor.name === 'AsyncFunction') {
          logger.debug('Fetching options asynchronously');
          const retrievedOptions = searchAsYouType
            ? await retrieveOptionsFunc(inputValue)
            : // @ts-expect-error: We know that retrieveOptionsFunc can be called without parameters when searchAsYouType is false
              await retrieveOptionsFunc();
          setOptions(retrievedOptions);
        } else {
          logger.debug('Fetching options synchronously');
          const retrievedOptions = searchAsYouType
            ? (retrieveOptionsFunc(inputValue) as Value[])
            : // @ts-expect-error: We know that retrieveOptionsFunc can be called without parameters when searchAsYouType is false
              (retrieveOptionsFunc() as Value[]);
          setOptions(retrievedOptions);
        }
        setLoading(false);
      })();
    } catch (e) {
      setFetchError(e instanceof Error ? e : new Error(String(e)));
      setLoading(false);
    }
  }, [searchAsYouType, inputValue, retrieveOptionsFunc]);

  const handleOpen = () => {
    setOpen(true);
    // When searchAsYouType is enabled, options are fetched on each input change, so skip fetching here
    if (searchAsYouType) {
      logger.debug('searchAsYouType is enabled, skipping fetching options on open');
      return;
    }

    void fetchOptions();
  };

  const handleClose = () => {
    setOpen(false);
    setOptions([]);
  };

  useEnhancedEffect(() => {
    if (!Boolean(inputValue)) {
      logger.warn('Current inputValue is empty, skip fetching and returning empty options');
      setOptions([]);
      return;
    }

    logger.debug('Input value changed, fetching options with keywords: %s', inputValue);
    void fetchOptions();
  }, [inputValue]);

  if (fetchError) {
    return <ErrorAlert error={fetchError} />;
  }
  return (
    <MuiAutocomplete
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      options={options}
      renderOption={renderOption}
      loading={loading}
      onInputChange={
        searchAsYouType
          ? // REVISIT: Still triggers quote often when typing longer words which is resultung in many requests
            debounce((_, value) => setInputValue(value), props.debounceInMillis ?? 300)
          : undefined
      }
      defaultValue={defaultValue}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          name={name}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
      selectOnFocus
      autoHighlight
      {...props}
    />
  );
};
