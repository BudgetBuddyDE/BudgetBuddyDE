import {Grid, type GridProps} from '@mui/material';
import type React from 'react';
import {
  type ControllerFieldState,
  type ControllerRenderProps,
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';

export type CustomField<T extends FieldValues> = {
  type: 'custom';
  name: Path<T>;
  size?: GridProps['size'];
  render: (props: {field: ControllerRenderProps<T, Path<T>>; fieldState: ControllerFieldState}) => React.ReactElement;
};

export type CustomFieldComponentProps<T extends FieldValues> = {
  field: CustomField<T>;
  control: Control<T>;
  wrapperSize: GridProps['size'];
};

export const CustomFieldComponent = <T extends FieldValues>({
  field,
  control,
  wrapperSize,
}: CustomFieldComponentProps<T>) => (
  <Grid key={field.name} size={wrapperSize}>
    <Controller
      name={field.name}
      control={control}
      render={({field: controllerField, fieldState}) => field.render({field: controllerField, fieldState})}
    />
  </Grid>
);
