'use client';

import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  type DatePickerProps as MuiDatePickerProps,
  // PickerValidDate,
} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {deDE as pickerDeDE, enUS as pickerEnUS} from '@mui/x-date-pickers/locales';
import {de, enUS} from 'date-fns/locale';
import type React from 'react';
import {useOptionalPreferencesContext} from '@/hooks/usePreferences';

export type DateTickerProps = MuiDatePickerProps;
export const DatePicker: React.FC<DateTickerProps> = props => {
  const preferences = useOptionalPreferencesContext();
  const isGerman = preferences?.locale === 'de-DE';
  const pickerLocale = isGerman ? pickerDeDE : pickerEnUS;
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={isGerman ? de : enUS}
      localeText={pickerLocale.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <MuiDatePicker format="dd.MM.yyyy" {...props} />
    </LocalizationProvider>
  );
};
