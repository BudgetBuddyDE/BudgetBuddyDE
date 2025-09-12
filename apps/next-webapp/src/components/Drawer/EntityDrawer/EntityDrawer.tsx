import { Grid, GridProps, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import {
  Controller,
  type DefaultValues,
  type FieldValues,
  useForm,
  type Path,
} from 'react-hook-form';

import { useKeyPress } from '@/hooks/useKeyPress';

import { Drawer, type DrawerProps } from '../Drawer';
import { EntityHeader } from './EntityHeader';
import { EntityFooter } from './EntityFooter';
import { ErrorAlert } from '@/components/ErrorAlert';
import { isRunningOnIOs } from '@/utils/determineOS';
import { DatePicker } from '@/components/Form/DatePicker';
import { Autocomplete, type AutocompleteProps } from '@/components/Form/Autocomplete';

type BaseAttributes<T, U extends FieldValues> = {
  size?: GridProps['size'];
  name: Path<U>;
  label: string;
} & Pick<TextFieldProps, 'placeholder' | 'required'> &
  T;

type DateField<T extends FieldValues> = BaseAttributes<
  {
    type: 'date';
  },
  T
>;
type TextField<T extends FieldValues> = BaseAttributes<
  { type: 'text' } & ({ area?: false } | { area: true; rows: number }),
  T
>;
type NumberField<T extends FieldValues> = BaseAttributes<{ type: 'number' }, T>;

type AutocompleteField<T extends FieldValues, Value> = BaseAttributes<
  { type: 'autocomplete' /*inputValueKey: keyof Value */ },
  T
> &
  Pick<
    //  REVISIT: Make this more specific
    AutocompleteProps<Value, any, any, any, any>,
    'retrieveOptionsFunc' | 'isOptionEqualToValue' | 'getOptionLabel' | 'noOptionsText'
  >;

type EntityDrawerField<T extends FieldValues> =
  | DateField<T>
  | TextField<T>
  | NumberField<T>
  | AutocompleteField<T, unknown>;

export type EntityDrawerFormHandler<T extends FieldValues> = (
  payload: T,
  onSuccess: () => void
) => void;

export type EntityDrawer<T extends FieldValues> = Pick<
  DrawerProps,
  'open' | 'closeOnEscape' | 'closeOnBackdropClick'
> & {
  onClose: () => void;
  onResetForm?: () => T | DefaultValues<T> | undefined;
  title: string;
  subtitle?: string;
  defaultValues?: DefaultValues<T> | undefined;
  onSubmit: EntityDrawerFormHandler<T>;
  isLoading?: boolean;
  fields?: EntityDrawerField<T>[];
};

export const EntityDrawer = <T extends FieldValues>({
  open,
  onClose,
  onResetForm,
  title,
  subtitle,
  defaultValues,
  onSubmit,
  closeOnBackdropClick,
  closeOnEscape,
  isLoading = false,
  fields = [],
}: EntityDrawer<T>) => {
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const saveBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const form = useForm<T>({ defaultValues: defaultValues });

  useKeyPress(
    ['s'],
    (e) => {
      if (saveBtnRef.current) {
        e.preventDefault();
        saveBtnRef.current.click();
      }
    },
    drawerRef.current,
    true
  );

  const handler = {
    handleClose() {
      onClose();
      handler.handleFormReset();
    },
    handleSubmit(data: T) {
      onSubmit(data, handler.handleFormReset);
      handler.handleFormReset();
    },
    handleFormReset() {
      if (onResetForm) {
        const newValues = onResetForm();
        form.reset(newValues);
      } /*else {
        form.reset(
          Object.fromEntries(
            Object.entries(defaultValues || {}).map(([key, value]) => [key, null])
          ) as DefaultValues<T>
        );
      }*/
    },
  };

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  return (
    <Drawer
      ref={drawerRef}
      open={open}
      onClose={handler.handleClose}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
    >
      <React.Fragment>
        <EntityHeader title={title} subtitle={subtitle} onClose={handler.handleClose} />

        <form
          onSubmit={form.handleSubmit((data) => {
            console.log(data);
            handler.handleSubmit(data);
          })}
          style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          noValidate
        >
          <Grid container spacing={2} sx={{ m: 2 }}>
            {fields.map((input) => {
              const isInputRequired = input.required || false;
              const inputRequiredMessage: string | undefined = isInputRequired
                ? `${input.label} is required`
                : undefined;
              const inputType = input.type;
              const wrapperSize = input.size || { xs: 12 };

              switch (inputType) {
                case 'date':
                  const formDefaultValues = form.formState.defaultValues;
                  const defaultDate = formDefaultValues ? formDefaultValues[input.name] : undefined;
                  return (
                    <Grid size={wrapperSize}>
                      <Controller
                        name={input.name}
                        control={form.control}
                        // @ts-expect-error
                        defaultValue={defaultDate ? new Date(defaultDate) : new Date()}
                        render={({
                          field: { name, onChange, value, ref },
                          fieldState: { error },
                        }) => (
                          <DatePicker
                            value={value}
                            onChange={onChange}
                            onAccept={onChange}
                            inputRef={ref}
                            slotProps={{
                              textField: {
                                ...form.register(name, { required: inputRequiredMessage }),
                                label: input.label,
                                error: !!error,
                                helperText: error?.message,
                                required: isInputRequired,
                                fullWidth: true,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  );

                case 'number':
                  return (
                    <Grid size={wrapperSize}>
                      <Controller
                        name={input.name}
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            type={'number'}
                            {...field}
                            label={input.label}
                            placeholder={input.placeholder}
                            {...form.register(field.name, { required: inputRequiredMessage })}
                            error={!!error}
                            helperText={error?.message}
                            fullWidth
                            required={isInputRequired}
                            slotProps={{
                              htmlInput: { inputMode: isRunningOnIOs() ? 'text' : 'numeric' },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  );

                case 'text':
                  return (
                    <Grid size={wrapperSize}>
                      <Controller
                        name={input.name}
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            type={'text'}
                            {...field}
                            label={input.label}
                            placeholder={input.placeholder}
                            {...form.register(field.name, { required: inputRequiredMessage })}
                            error={!!error}
                            helperText={error?.message}
                            fullWidth
                            required={isInputRequired}
                            multiline={input.area}
                            rows={input.area ? input.rows : undefined}
                          />
                        )}
                      />
                    </Grid>
                  );

                case 'autocomplete':
                  return (
                    <Grid size={wrapperSize}>
                      <Controller
                        name={input.name}
                        control={form.control}
                        render={({ field, fieldState: { error } }) => (
                          <Autocomplete
                            {...form.register(field.name, { required: inputRequiredMessage })}
                            onChange={(_, data) => {
                              field.onChange(data);
                              console.log(form.getValues());
                            }}
                            label={input.label}
                            name={input.name}
                            placeholder={input.placeholder}
                            required={isInputRequired}
                            isOptionEqualToValue={input.isOptionEqualToValue}
                            getOptionLabel={input.getOptionLabel}
                            retrieveOptionsFunc={input.retrieveOptionsFunc}
                            error={!!error}
                            helperText={error?.message}
                            // experimental
                            autoSelect
                            autoComplete
                          />
                        )}
                      />
                    </Grid>
                  );

                default:
                  return <ErrorAlert error={new Error(`Unknown field type: ${inputType}`)} />;
              }
            })}
          </Grid>

          <EntityFooter ref={saveBtnRef} onClose={handler.handleClose} isLoading={isLoading} />
        </form>
      </React.Fragment>
    </Drawer>
  );
};
