'use client';

import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  type DatePickerProps as MuiDatePickerProps,
  // PickerValidDate,
} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {enUS as pickerEnUS} from '@mui/x-date-pickers/locales';
import {enUS} from 'date-fns/locale';
import type React from 'react';

export type DateTickerProps = MuiDatePickerProps;
export const DatePicker: React.FC<DateTickerProps> = props => {
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={enUS}
      localeText={pickerEnUS.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <MuiDatePicker format="dd.MM.yyyy" {...props} />
    </LocalizationProvider>
  );
};
