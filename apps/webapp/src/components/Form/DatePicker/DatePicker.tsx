'use client';

import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  type DatePickerProps as MuiDatePickerProps,
  // PickerValidDate,
} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {enUS} from 'date-fns/locale/en-US';
import type React from 'react';

export type DateTickerProps = MuiDatePickerProps;
export const DatePicker: React.FC<DateTickerProps> = props => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
      <MuiDatePicker format="MM/dd/yyyy" {...props} />
    </LocalizationProvider>
  );
};
