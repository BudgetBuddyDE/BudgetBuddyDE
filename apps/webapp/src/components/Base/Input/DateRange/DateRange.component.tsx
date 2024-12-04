import {Stack, type SxProps, type Theme} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';

import {DatePicker} from '../DatePicker';

export type TDateRange = {
  startDate: Date;
  endDate: Date;
};

export type TDateRangeProps = {
  onDateChange: (range: TDateRange) => void;
  dateFormat?: string;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  startDateLabel?: string;
  endDateLabel?: string;
  startDateSx?: SxProps<Theme>;
  endDateSx?: SxProps<Theme>;
  containerSx?: SxProps<Theme>;
  inputSize?: 'small' | 'medium';
};

export const DateRange: React.FC<TDateRangeProps> = ({
  onDateChange,
  defaultStartDate = new Date(),
  defaultEndDate = new Date(),
  startDateLabel = 'From',
  endDateLabel = 'To',
  startDateSx,
  endDateSx,
  containerSx,
  inputSize = 'medium',
}) => {
  const [startDate, setStartDate] = React.useState(defaultStartDate);
  const [endDate, setEndDate] = React.useState(defaultEndDate);

  const handler = {
    onStartDateChange: (date: Date | null) => {
      const d = date ?? new Date();
      setStartDate(d);
      onDateChange({startDate: d, endDate: endDate});
    },
    onEndDateChange: (date: Date | null) => {
      const d = date ?? new Date();
      setEndDate(d);
      onDateChange({startDate: startDate, endDate: d});
    },
  };

  return (
    <Stack flexDirection={'row'} gap={AppConfig.baseSpacing} sx={containerSx}>
      <DatePicker
        value={startDate}
        onChange={value => handler.onStartDateChange(value)}
        onAccept={value => handler.onStartDateChange(value)}
        slotProps={{
          textField: {
            label: startDateLabel,
            required: true,
            fullWidth: true,
            size: inputSize,
            sx: {
              dispaly: 'flex',
              flex: 1,
              ...startDateSx,
            },
          },
        }}
      />
      <DatePicker
        value={endDate}
        onChange={value => handler.onEndDateChange(value)}
        onAccept={value => handler.onEndDateChange(value)}
        slotProps={{
          textField: {
            label: endDateLabel,
            required: true,
            fullWidth: true,
            size: inputSize,
            sx: {
              dispaly: 'flex',
              flex: 1,
              ...endDateSx,
            },
          },
        }}
      />
    </Stack>
  );
};
