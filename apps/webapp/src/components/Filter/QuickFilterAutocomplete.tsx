'use client';

import {Autocomplete, CircularProgress, TextField, Typography} from '@mui/material';
import React from 'react';

export type QuickFilterAutocompleteOption = {
  id: string;
  label: string;
};

export type QuickFilterAutocompleteProps = {
  label: string;
  value: string[];
  options: QuickFilterAutocompleteOption[];
  loading?: boolean;
  width?: number;
  onChange: (value: string[]) => void;
};

export const QuickFilterAutocomplete: React.FC<QuickFilterAutocompleteProps> = ({
  label,
  value,
  options,
  loading = false,
  width = 184,
  onChange,
}) => {
  const selectedOptions = options.filter(option => value.includes(option.id));

  return (
    <Autocomplete<QuickFilterAutocompleteOption, true>
      multiple
      disableCloseOnSelect
      autoHighlight
      selectOnFocus
      size="small"
      value={selectedOptions}
      options={options}
      loading={loading}
      onChange={(_, selected) => onChange(selected.map(option => option.id))}
      getOptionLabel={option => option.label}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderTags={selected => {
        const selectedLabel = selected.length === 1 ? selected[0].label : `${selected.length} selected`;
        return (
          <Typography component="span" variant="body2" noWrap sx={{maxWidth: Math.max(72, width - 112), flexShrink: 1}}>
            {selectedLabel}
          </Typography>
        );
      }}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {option.label}
        </li>
      )}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={selectedOptions.length === 0 ? label : undefined}
          slotProps={{
            htmlInput: {
              ...params.inputProps,
              'aria-label': label,
            },
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
      noOptionsText={`No ${label.toLowerCase()} found`}
      slotProps={{
        paper: {elevation: 0, sx: {mt: 0.5}},
        listbox: {
          sx: {
            p: 0.5,
            '& .MuiAutocomplete-option': {
              minHeight: 32,
              px: 1,
              py: 0.5,
              fontSize: '0.875rem',
            },
          },
        },
      }}
      sx={{
        width,
        minWidth: 0,
        '& .MuiAutocomplete-input': {
          minWidth: '36px !important',
        },
      }}
    />
  );
};
