import { Grid, type GridProps } from '@mui/material';
import React from 'react';
import { Controller, type Control, type FieldValues } from 'react-hook-form';
import { Autocomplete, type AutocompleteProps } from '@/components/Form/Autocomplete';
import { type BaseAttributes } from '../types';

export type AutocompleteField<T extends FieldValues, Value> = BaseAttributes<
  { type: 'autocomplete' },
  T
> &
  Pick<
    AutocompleteProps<Value, any, any, any, any>,
    | 'retrieveOptionsFunc'
    | 'isOptionEqualToValue'
    | 'renderOption'
    | 'getOptionLabel'
    | 'noOptionsText'
    | 'filterOptions'
    | 'disableCloseOnSelect'
    | 'multiple'
  >;

export type AutocompleteFieldComponentProps<T extends FieldValues> = {
  field: AutocompleteField<T, unknown>;
  control: Control<T>;
  wrapperSize: GridProps['size'];
};

export const AutocompleteFieldComponent = <T extends FieldValues>({
  field,
  control,
  wrapperSize,
}: AutocompleteFieldComponentProps<T>) => {
  const inputRequiredMessage = field.required ? `${field.label} ist erforderlich` : undefined;

  return (
    <Grid key={field.name} size={wrapperSize}>
      <Controller
        name={field.name}
        control={control}
        rules={{ required: inputRequiredMessage }}
        render={({ field: controllerField, fieldState: { error } }) => (
          <Autocomplete
            name={field.name}
            required={field.required}
            label={field.label}
            placeholder={field.placeholder}
            value={controllerField.value || null}
            onChange={(_, value) => controllerField.onChange(value)}
            retrieveOptionsFunc={field.retrieveOptionsFunc}
            getOptionLabel={field.getOptionLabel}
            error={!!error}
            helperText={error?.message}
            fullWidth
            // REVISIT: autoSelect
            autoComplete
            isOptionEqualToValue={field.isOptionEqualToValue}
            filterOptions={field.filterOptions}
            renderOption={field.renderOption}
            multiple={field.multiple}
            disableCloseOnSelect={field.disableCloseOnSelect}
            noOptionsText={field.noOptionsText}
          />
        )}
      />
    </Grid>
  );
};
