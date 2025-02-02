import {Autocomplete, type SxProps, TextField, type Theme} from '@mui/material';
import React from 'react';

import {StyledAutocompleteOption} from '@/components/Base/Input';

export type TSelectCategoriesOption = {label: string; value: string};

export type TSelectCategoriesProps = {
  isLoading?: boolean;
  size?: 'small' | 'medium';
  value?: TSelectCategoriesOption[];
  onChange: (values: TSelectCategoriesOption[]) => void;
  options: TSelectCategoriesOption[];
  sx?: SxProps<Theme>;
  limitTags?: number;
  required?: boolean;
};

export const SelectCategories: React.FC<TSelectCategoriesProps> = ({
  value = [],
  size = 'small',
  isLoading,
  onChange,
  options,
  sx,
  limitTags = 2,
  required = false,
}) => {
  return (
    <Autocomplete
      size={size}
      sx={sx}
      loading={isLoading}
      limitTags={limitTags}
      renderInput={params => (
        <TextField
          {...params}
          required={required}
          // inputRef={input => {
          //   autocompleteRef.current = input;
          // }}
          label="Categories"
          placeholder={'Select categories'}
        />
      )}
      onChange={(_, values) => onChange(values)}
      value={value}
      selectOnFocus
      autoHighlight
      options={options}
      renderOption={(props, option, {selected}) => (
        <StyledAutocompleteOption {...props} selected={selected}>
          {option.label}
        </StyledAutocompleteOption>
      )}
      disableCloseOnSelect
      multiple
    />
  );
};
