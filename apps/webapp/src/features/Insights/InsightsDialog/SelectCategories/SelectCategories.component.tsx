import {Autocomplete, type SxProps, TextField, type Theme} from '@mui/material';
import React from 'react';

import {StyledAutocompleteOption} from '@/components/Base/Input';

export type TSelectCategoriesOption = {label: string; value: string};

export type TSelectCategoriesProps = {
  value?: TSelectCategoriesOption[];
  onChange: (values: TSelectCategoriesOption[]) => void;
  options: TSelectCategoriesOption[];
  sx?: SxProps<Theme>;
  limitTags?: number;
};

export const SelectCategories: React.FC<TSelectCategoriesProps> = ({
  value = [],
  onChange,
  options,
  sx,
  limitTags = 2,
}) => {
  return (
    <Autocomplete
      size="small"
      sx={sx}
      limitTags={limitTags}
      renderInput={params => (
        <TextField
          {...params}
          // inputRef={input => {
          //   autocompleteRef.current = input;
          // }}
          label="Categories"
          placeholder={'Select categories'}
        />
      )}
      onChange={(_, values) => onChange(values)}
      value={value}
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
