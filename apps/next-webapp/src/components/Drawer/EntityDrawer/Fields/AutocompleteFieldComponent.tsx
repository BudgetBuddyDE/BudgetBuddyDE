'use client';

import debounce from 'lodash.debounce';
import { Grid, type GridProps } from '@mui/material';
import React from 'react';
import { Controller, type Control, type FieldValues } from 'react-hook-form';
import { Autocomplete, type AutocompleteProps } from '@/components/Form/Autocomplete';
import { type BaseAttributes } from '../types';

export type AutocompleteField<T extends FieldValues, Value> = Omit<
  BaseAttributes<
    {
      type: 'autocomplete';
      retrieveOptionsFunc: (inputValue?: string) => Value[] | Promise<Value[]>;
    },
    T
  >,
  'slotProps' // Omit the slotProps from TextFieldProps as we extend it with slotsProps from AutocompleteProps
> &
  Pick<
    AutocompleteProps<Value, any, any, any, any>,
    // | 'retrieveOptionsFunc' // Replace retrieveOptionsFunc with an customized function
    | 'isOptionEqualToValue'
    | 'renderOption'
    | 'getOptionLabel'
    | 'noOptionsText'
    | 'filterOptions'
    | 'disableCloseOnSelect'
    | 'multiple'
    | 'slotProps'
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
  const inputRequiredMessage = field.required
    ? `${field.label ?? field.name} is required`
    : undefined;
  const [currentInputText, setCurrentInputText] = React.useState('');

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
            onInputChange={(_, value, reason) => {
              console.log('AutocompleteFieldComponent - onInputChange', { value, reason });
              setCurrentInputText(value);
            }}
            onChange={(_, value) => controllerField.onChange(value)}
            retrieveOptionsFunc={async () => {
              console.log('AutocompleteFieldComponent - Calling retrieveOptionsFunc');
              const options = await field.retrieveOptionsFunc(currentInputText);
              console.log('Retrieved options:', options);
              return options;
            }}
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
            slotProps={field.slotProps}
          />
        )}
      />
    </Grid>
  );
};
