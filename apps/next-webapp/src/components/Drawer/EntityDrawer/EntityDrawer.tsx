import { Grid } from '@mui/material';
import React, { JSX } from 'react';
import { type DefaultValues, type FieldValues, useForm } from 'react-hook-form';
import { useKeyPress } from '@/hooks/useKeyPress';
import { parseNumber } from '@/utils/parseNumber';
import { Drawer } from '../Drawer';
import { EntityHeader } from './EntityHeader';
import { EntityFooter } from './EntityFooter';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  DateFieldComponent,
  TextFieldComponent,
  NumberFieldComponent,
  AutocompleteFieldComponent,
  SelectFieldComponent,
} from './Fields';
import { type EntityDrawerField } from './types';
import { type DrawerProps } from '../Drawer';

export type EntityDrawerFormHandler<T extends FieldValues> = (
  payload: T,
  onSuccess: () => void
) => void;

export type EntityDrawerProps<T extends FieldValues> = Pick<
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

/**
 * Generic drawer component that can dynamically generate forms.
 * Uses React-Hook-Form for optimal performance and type safety.
 * Supports default values for editing records.
 */
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
}: EntityDrawerProps<T>) => {
  const drawerRef = React.useRef<HTMLDivElement | null>(null);
  const saveBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const form = useForm<T>({
    defaultValues: defaultValues,
    mode: 'onBlur', // Validation on blur only for better UX
  });

  // Shortcut for saving/submitting (Strg/Cmd + S)
  useKeyPress(
    ['s'],
    (e) => {
      if (saveBtnRef.current && open) {
        e.preventDefault();
        saveBtnRef.current.click();
      }
    },
    drawerRef.current,
    true
  );

  const handlers = React.useMemo(
    () => ({
      handleClose: () => {
        onClose();
        handlers.handleFormReset();
      },
      handleSubmit: (data: T) => {
        onSubmit(data, () => {
          handlers.handleFormReset();
        });
      },
      handleFormReset: () => {
        if (onResetForm) {
          const newValues = onResetForm();
          console.log('Handler - onResetForm provided, resetting to:', newValues);
          form.reset(newValues);
        } else {
          console.log('Handler - No onResetForm, using defaultValues:', defaultValues);
          form.reset(defaultValues);
        }
      },
    }),
    [onClose, onSubmit, onResetForm, form, defaultValues]
  );

  // Only reset form when drawer is opened or defaultValues change
  React.useEffect(() => {
    if (open && defaultValues) {
      console.log('Resetting form to default values:', defaultValues);
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  // Memoize the rendered fields to optimize performance
  const renderedFields: JSX.Element[] = React.useMemo(() => {
    return fields.map((field) => {
      const wrapperSize = field.size || { xs: 12 };

      switch (field.type) {
        case 'date':
          return (
            <DateFieldComponent
              key={field.name}
              field={field}
              control={form.control}
              wrapperSize={wrapperSize}
            />
          );

        case 'text':
          return (
            <TextFieldComponent
              key={field.name}
              field={field}
              control={form.control}
              wrapperSize={wrapperSize}
            />
          );

        case 'number':
          return (
            <NumberFieldComponent
              key={field.name}
              field={field}
              control={form.control}
              wrapperSize={wrapperSize}
            />
          );

        case 'autocomplete':
          return (
            <AutocompleteFieldComponent
              key={field.name}
              field={field}
              control={form.control}
              wrapperSize={wrapperSize}
            />
          );

        case 'select':
          return (
            <SelectFieldComponent
              key={field.name}
              field={field}
              control={form.control}
              wrapperSize={wrapperSize}
            />
          );

        default:
          return (
            <Grid key={(field as any).name || `unknown-${Math.random()}`} size={{ xs: 12 }}>
              <ErrorAlert
                error={new Error(`Unbekannter Feldtyp: ${(field as any).type}`)}
                sx={{ width: '100%' }}
              />
            </Grid>
          );
      }
    });
  }, [fields, form.control]);

  return (
    <Drawer
      ref={drawerRef}
      open={open}
      onClose={handlers.handleClose}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
    >
      <EntityHeader title={title} subtitle={subtitle} onClose={handlers.handleClose} />

      <form
        onSubmit={form.handleSubmit((data) =>
          handlers.handleSubmit(preProcessFormPayload(data, fields))
        )}
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        noValidate
      >
        <Grid container spacing={2} sx={{ m: 2 }}>
          {renderedFields}
        </Grid>

        <EntityFooter ref={saveBtnRef} onClose={handlers.handleClose} isLoading={isLoading} />
      </form>
    </Drawer>
  );
};

// Export types for convenience
export type { FirstLevelNullable, EntityDrawerField } from './types';

/**
 * This function takes the raw form data and checks which fields are of type number. It looks into the fields and filters by type "number", using "name" to get the corresponding values.
 * @param formData Object containing the form data
 * @param fields Array of field definitions
 * @returns Object containing the processed form data
 */
function preProcessFormPayload<T extends FieldValues>(
  formData: T,
  fields: EntityDrawerField<T>[]
): T {
  // Create a copy of the original form data
  const processedData = { ...formData };

  // Get all fields with type "number"
  const numberFields = fields.filter((field) => field.type === 'number');

  // Iterate over all number fields and parse the numbers
  numberFields.forEach((field) => {
    const fieldName = field.name;
    const fieldValue = processedData[fieldName];

    if (fieldValue != null && fieldValue !== '') {
      const parsedValue = parseNumber(String(fieldValue));
      if (!isNaN(parsedValue)) {
        (processedData as any)[fieldName] = parsedValue;
      }
    }
  });

  return processedData;
}
