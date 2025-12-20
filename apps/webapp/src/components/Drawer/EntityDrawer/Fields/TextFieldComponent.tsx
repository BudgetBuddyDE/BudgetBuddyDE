import {Grid, type GridProps, TextField as MuiTextField} from '@mui/material';
import {type Control, Controller, type FieldValues} from 'react-hook-form';
import type {BaseAttributes} from '../types';

export type TextField<T extends FieldValues> = BaseAttributes<
  {type: 'text'} & ({area?: false} | {area: true; rows: number}),
  T
>;
export type TextFieldComponentProps<T extends FieldValues> = {
  field: TextField<T>;
  control: Control<T>;
  wrapperSize: GridProps['size'];
};

export const TextFieldComponent = <T extends FieldValues>({
  field,
  control,
  wrapperSize,
}: TextFieldComponentProps<T>) => {
  const inputRequiredMessage = field.required ? `${field.label ?? field.name} is required` : undefined;

  return (
    <Grid key={field.name} size={wrapperSize}>
      <Controller
        name={field.name}
        control={control}
        rules={{required: inputRequiredMessage}}
        render={({field: controllerField, fieldState: {error}}) => (
          <MuiTextField
            type="text"
            {...controllerField}
            value={controllerField.value || ''}
            label={field.label}
            placeholder={field.placeholder}
            error={!!error}
            helperText={error?.message}
            fullWidth
            required={field.required}
            multiline={field.area}
            rows={field.area ? field.rows : undefined}
            slotProps={field.slotProps}
          />
        )}
      />
    </Grid>
  );
};
