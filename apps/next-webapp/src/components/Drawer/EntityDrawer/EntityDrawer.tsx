import { Grid } from '@mui/material';
import React, { JSX } from 'react';
import { type DefaultValues, type FieldValues, useForm } from 'react-hook-form';
import { useKeyPress } from '@/hooks/useKeyPress';
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
 * Generische Drawer-Komponente mit welcher dynamisch Formulare generiert werden können.
 * Verwendet React-Hook-Form für optimale Performance und Typensicherheit.
 * Unterstützt Standardwerte für das Bearbeiten von Datensätzen.
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
  // Form mit Memoization für bessere Performance
  const form = useForm<T>({
    defaultValues: defaultValues,
    mode: 'onBlur', // Validation nur bei Blur für bessere UX
  });

  // Keyboard-Shortcut for saving/submitting (Strg/Cmd + S)
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

  // Optimierte Handler-Funktionen
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

  // Defaultwerte nur bei Änderung aktualisieren
  React.useEffect(() => {
    if (open && defaultValues) {
      console.log('Resetting form to default values:', defaultValues);
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  // Memoized Feld-Rendering für bessere Performance
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
        onSubmit={form.handleSubmit(handlers.handleSubmit)}
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
