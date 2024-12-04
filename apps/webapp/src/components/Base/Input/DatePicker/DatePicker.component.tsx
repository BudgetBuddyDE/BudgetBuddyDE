import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  type DatePickerProps as MuiDatePickerProps,
  PickerValidDate,
} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import React from 'react';

export type TDatePickerProps<TEnableAccessibleFieldDOMStructure extends boolean = false> = MuiDatePickerProps<
  PickerValidDate,
  TEnableAccessibleFieldDOMStructure
>;

export const DatePicker: React.FC<TDatePickerProps<false>> = props => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker format="dd.MM.yyyy" {...props} />
    </LocalizationProvider>
  );
};
