'use client';

import {FormControl, MenuItem, OutlinedInput, Select, type SelectChangeEvent} from '@mui/material';
import React from 'react';

export type QuickFilterSelectOption = {
  value: string;
  label: string;
};

export type QuickFilterSelectProps = {
  label: string;
  resetLabel: string;
  value: string;
  options: QuickFilterSelectOption[];
  width?: number;
  onChange: (value: string) => void;
};

export const QuickFilterSelect: React.FC<QuickFilterSelectProps> = ({
  label,
  resetLabel,
  value,
  options,
  width = 160,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size="small" sx={{width, minWidth: 0}}>
      <Select
        displayEmpty
        value={value}
        onChange={handleChange}
        input={<OutlinedInput />}
        inputProps={{'aria-label': label}}
        renderValue={selected => options.find(option => option.value === selected)?.label ?? label}
        MenuProps={{
          slotProps: {
            paper: {
              elevation: 0,
              sx: {
                mt: 0.5,
                '& .MuiList-root': {
                  m: 0.5,
                },
                '& .MuiMenuItem-root': {
                  minHeight: 32,
                  px: 1,
                  py: 0.5,
                  fontSize: '0.875rem',
                },
              },
            },
          },
        }}
        sx={{
          height: 40,
          color: value ? 'text.primary' : 'text.secondary',
        }}
      >
        <MenuItem value="">{resetLabel}</MenuItem>
        {options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
