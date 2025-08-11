import { Grid, GridProps, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import {
  Controller,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
  useForm,
  type Path,
} from 'react-hook-form';

import { useKeyPress } from '@/hooks/useKeyPress';

import { Drawer, type DrawerProps } from '../Drawer';
import { EntityHeader } from './EntityHeader';
import { EntityFooter } from './EntityFooter';
import { ErrorAlert } from '@/components/ErrorAlert';
import { isRunningOnIOs } from '@/utils/determineOS';
import { logger } from '@/logger';

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

type EntityDrawerField<T extends FieldValues> = DateField<T> | TextField<T> | NumberField<T>;

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
        console.log('clicked the button');
      } else console.log("didn't click the button");
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
          onSubmit={form.handleSubmit(handler.handleSubmit)}
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
                  return <Grid size={wrapperSize}>DATE</Grid>;

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
