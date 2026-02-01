'use client';

import {Stack, type StackProps} from '@mui/material';
import React from 'react';
import {DatePicker, type DateTickerProps} from '../DatePicker';

export type DateRangeState = {
  startDate: Date | null;
  endDate: Date | null;
};

export type DateRangePickerProps = {
  slotProps?: {
    stack?: StackProps;
    startDateTicker?: DateTickerProps;
    endDateTicker?: DateTickerProps;
  };
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  defaultValue?: Partial<DateRangeState>;
  /**
   * Size of the date picker inputs.
   * @default 'medium'
   */
  size?: 'small' | 'medium';
  /**
   * Date format string for displaying dates in the picker inputs.
   * @default 'MMM yyyy'
   */
  dateFormat?: string;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  slotProps,
  onDateRangeChange,
  defaultValue,
  size = 'medium',
  dateFormat = 'MMM yyyy',
}) => {
  const [value, setValue] = React.useState<DateRangeState>({
    startDate: defaultValue?.startDate ?? null,
    endDate: defaultValue?.endDate ?? null,
  });
  const [openField, setOpenField] = React.useState<'START' | 'END' | null>(null);

  const handleStartDateChange = (date: Date | null) => {
    setValue(prev => ({...prev, startDate: date}));
  };

  const handleEndDateChange = (date: Date | null) => {
    setValue(prev => ({...prev, endDate: date}));
  };

  const handleEndDatePickerClose = () => {
    setOpenField(null);

    // Trigger callback only once when date range selection is complete
    if (onDateRangeChange) {
      onDateRangeChange(value.startDate, value.endDate);
    }
  };

  return (
    <Stack direction={'row'} spacing={2} {...slotProps?.stack}>
      <DatePicker
        label="Start"
        defaultValue={value.startDate}
        onChange={handleStartDateChange}
        open={openField === 'START'}
        onClose={() => {
          // Open next calendar when actually closing this input
          setOpenField('END');
        }}
        format={dateFormat}
        slotProps={mergeSlotProps(slotProps?.startDateTicker, {
          field: {
            clearable: true,
            onClick() {
              setOpenField('START');
            },
            onClear() {
              handleStartDateChange(null);
            },
          },
          openPickerButton: {
            onClick() {
              setOpenField('START');
            },
          },
          textField: {
            size,
            sx: {
              width: 200,
            },
          },
        })}
      />
      <DatePicker
        label="End"
        defaultValue={value.endDate}
        onChange={handleEndDateChange}
        minDate={value.startDate ?? undefined}
        open={openField === 'END'}
        onClose={handleEndDatePickerClose}
        format={dateFormat}
        slotProps={mergeSlotProps(slotProps?.endDateTicker, {
          field: {
            clearable: true,
            onClick() {
              setOpenField('END');
            },
            onClear() {
              handleEndDateChange(null);
            },
          },
          openPickerButton: {
            onClick() {
              setOpenField('END');
            },
          },
          textField: {
            size,
            sx: {
              width: 200,
            },
          },
        })}
      />
    </Stack>
  );
};

function mergeSlotProps(
  userProps: DateTickerProps | undefined,
  internalSlotProps: Record<string, unknown>,
): Record<string, unknown> {
  const userSlotProps = (userProps?.slotProps as Record<string, unknown>) || {};
  return {
    ...userSlotProps,
    field: {
      // @ts-expect-error
      ...internalSlotProps.field,
      ...(userSlotProps.field || {}),
    },
    openPickerButton: {
      // @ts-expect-error
      ...internalSlotProps.openPickerButton,
      ...(userSlotProps.openPickerButton || {}),
    },
    textField: {
      // @ts-expect-error
      ...internalSlotProps.textField,
      ...(userSlotProps.textField || {}),
    },
  };
}
