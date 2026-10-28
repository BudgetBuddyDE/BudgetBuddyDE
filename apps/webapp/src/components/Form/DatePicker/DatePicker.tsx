'use client';

import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  type DatePickerProps as MuiDatePickerProps,
  // PickerValidDate,
} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {de} from 'date-fns/locale/de';
import {enUS} from 'date-fns/locale/en-US';
import {useLocale} from 'next-intl';
import type React from 'react';

export type DateTickerProps = MuiDatePickerProps;
export const DatePicker: React.FC<DateTickerProps> = props => {
  const locale = useLocale();
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale === 'de-DE' ? de : enUS}>
      <MuiDatePicker format={locale === 'de-DE' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'} {...props} />
    </LocalizationProvider>
  );
};
