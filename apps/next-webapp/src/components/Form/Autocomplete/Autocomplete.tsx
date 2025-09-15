'use client';

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
    retrieveOptionsFunc: () => Promise<Value[]> | Value[];
    label: string;
    name: string;
    required?: boolean;
    placeholder?: string;
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
  ...props
}: AutocompleteProps<Value, Multiple, DisableClearable, FreeSolo, ChipComponent>) => {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<readonly Value[]>([]);
  const [fetchError, setFetchError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleOpen = () => {
    try {
      setOpen(true);
      void (async () => {
        setLoading(true);
        if (retrieveOptionsFunc.constructor.name === 'AsyncFunction') {
          const retrievedOptions = await retrieveOptionsFunc();
          setOptions(retrievedOptions);
        } else {
          const retrievedOptions = retrieveOptionsFunc() as Value[];
          setOptions(retrievedOptions);
        }
        setLoading(false);
      })();
    } catch (e) {
      setFetchError(e instanceof Error ? e : new Error(String(e)));
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setOptions([]);
  };

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
