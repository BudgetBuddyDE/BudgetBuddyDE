import { Grid, type GridProps } from '@mui/material';
import React from 'react';
import { Controller, type Control, type FieldValues } from 'react-hook-form';
import { DatePicker } from '@/components/Form/DatePicker';
import { type BaseAttributes } from '../types';

export type DateField<T extends FieldValues> = BaseAttributes<
  {
    type: 'date';
  },
  T
>;

export type DateFieldComponentProps<T extends FieldValues> = {
  field: DateField<T>;
  control: Control<T>;
  wrapperSize: GridProps['size'];
};

export const DateFieldComponent = <T extends FieldValues>({
  field,
  control,
  wrapperSize,
}: DateFieldComponentProps<T>) => {
  const inputRequiredMessage = field.required
    ? `${field.label ?? field.name} is required`
    : undefined;

  return (
    <Grid key={field.name} size={wrapperSize}>
      <Controller
        name={field.name}
        control={control}
        rules={{ required: inputRequiredMessage }}
        render={({ field: { name, onChange, value, ref }, fieldState: { error } }) => (
          <DatePicker
            value={value || null}
            onChange={onChange}
            onAccept={onChange}
            inputRef={ref}
            slotProps={{
              ...field.slotProps,
              textField: {
                label: field.label,
                error: !!error,
                helperText: error?.message,
                required: field.required,
                fullWidth: true,
                placeholder: field.placeholder,
                ...field.slotProps,
              },
            }}
          />
        )}
      />
    </Grid>
  );
};
