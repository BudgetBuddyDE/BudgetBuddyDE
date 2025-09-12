'use client';

import { ErrorAlert } from '@/components/ErrorAlert';
import {
  TextField,
  Autocomplete as MuiAutocomplete,
  type AutocompleteProps as MuiAutocompleteProps,
  CircularProgress,
  ChipTypeMap,
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
      loading={loading}
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

// Top films as rated by IMDb users. http://www.imdb.com/chart/top
export const topFilms = [
  { title: 'The Shawshank Redemption', year: 1994 },
  { title: 'The Godfather', year: 1972 },
  { title: 'The Godfather: Part II', year: 1974 },
  { title: 'The Dark Knight', year: 2008 },
  { title: '12 Angry Men', year: 1957 },
  { title: "Schindler's List", year: 1993 },
  { title: 'Pulp Fiction', year: 1994 },
  {
    title: 'The Lord of the Rings: The Return of the King',
    year: 2003,
  },
  { title: 'The Good, the Bad and the Ugly', year: 1966 },
  { title: 'Fight Club', year: 1999 },
  {
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    year: 2001,
  },
  {
    title: 'Star Wars: Episode V - The Empire Strikes Back',
    year: 1980,
  },
  { title: 'Forrest Gump', year: 1994 },
  { title: 'Inception', year: 2010 },
  {
    title: 'The Lord of the Rings: The Two Towers',
    year: 2002,
  },
  { title: "One Flew Over the Cuckoo's Nest", year: 1975 },
  { title: 'Goodfellas', year: 1990 },
  { title: 'The Matrix', year: 1999 },
  { title: 'Seven Samurai', year: 1954 },
  {
    title: 'Star Wars: Episode IV - A New Hope',
    year: 1977,
  },
  { title: 'City of God', year: 2002 },
  { title: 'Se7en', year: 1995 },
  { title: 'The Silence of the Lambs', year: 1991 },
  { title: "It's a Wonderful Life", year: 1946 },
  { title: 'Life Is Beautiful', year: 1997 },
  { title: 'The Usual Suspects', year: 1995 },
  { title: 'Léon: The Professional', year: 1994 },
  { title: 'Spirited Away', year: 2001 },
  { title: 'Saving Private Ryan', year: 1998 },
  { title: 'Once Upon a Time in the West', year: 1968 },
  { title: 'American History X', year: 1998 },
  { title: 'Interstellar', year: 2014 },
];
