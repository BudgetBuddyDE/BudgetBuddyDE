import {ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {z} from 'zod';

import {ActionPaper} from '@/components/Base/ActionPaper';

export const ZSelectDataOption = z.enum(['INCOME', 'EXPENSES']);
export type TSelectDataOption = z.infer<typeof ZSelectDataOption>;

export const SELECT_DATA_OPTIONS = [
  {label: 'Income', value: 'INCOME' as TSelectDataOption},
  {label: 'Expenses', value: 'EXPENSES' as TSelectDataOption},
] as const;

export type TSelectDataProps = {
  value: TSelectDataOption;
  onChange: (value: TSelectDataOption) => void;
};

/**
 * A React functional component that renders a selection interface using a ToggleButtonGroup.
 */
export const SelectData: React.FC<TSelectDataProps> = ({value, onChange}) => {
  return (
    <ActionPaper sx={{width: 'min-content'}}>
      <ToggleButtonGroup
        size="small"
        color="primary"
        value={value}
        onChange={(_, newValue) => {
          if (newValue === value) return;
          onChange(newValue);
        }}
        exclusive>
        {SELECT_DATA_OPTIONS.map(({label, value}) => (
          <ToggleButton key={value} value={value}>
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ActionPaper>
  );
};
