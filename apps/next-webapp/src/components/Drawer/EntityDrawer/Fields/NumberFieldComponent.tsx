import { Grid, TextField, type GridProps } from '@mui/material';
import React from 'react';
import { Controller, type Control, type FieldValues } from 'react-hook-form';
import { parseNumber } from '@/utils/parseNumber';
import { isRunningOnIOs } from '@/utils/determineOS';
import { type BaseAttributes } from '../types';

export type NumberField<T extends FieldValues> = BaseAttributes<{ type: 'number' }, T>;

export type NumberFieldComponentProps<T extends FieldValues> = {
  field: NumberField<T>;
  control: Control<T>;
  wrapperSize: GridProps['size'];
};

export const NumberFieldComponent = <T extends FieldValues>({
  field,
  control,
  wrapperSize,
}: NumberFieldComponentProps<T>) => {
  const inputRequiredMessage = field.required
    ? `${field.label ?? field.name} is required`
    : undefined;

  return (
    <Grid key={field.name} size={wrapperSize}>
      <Controller
        name={field.name}
        control={control}
        rules={{ required: inputRequiredMessage }}
        render={({ field: controllerField, fieldState: { error } }) => (
          <TextField
            {...controllerField}
            value={controllerField.value || ''}
            onChange={(e) => {
              const value = e.target.value;
              const parsedValue = parseNumber(value);
              controllerField.onChange(parsedValue);
            }}
            label={field.label}
            placeholder={field.placeholder}
            error={!!error}
            helperText={error?.message}
            fullWidth
            required={field.required}
            slotProps={{
              ...field.slotProps,
              htmlInput: {
                inputMode: isRunningOnIOs() ? 'text' : 'numeric',
                ...field.slotProps?.htmlInput,
              },
            }}
          />
        )}
      />
    </Grid>
  );
};
