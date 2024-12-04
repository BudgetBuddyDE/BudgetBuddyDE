import {ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';

import {ActionPaper} from '@/components/Base/ActionPaper';

export const SELECT_DATA_OPTIONS = [
  {label: 'Income', value: 'INCOME'},
  {label: 'Expenses', value: 'EXPENSES'},
] as const;

export type TSelectDataOption = {
  value: (typeof SELECT_DATA_OPTIONS)[number]['value'];
  onChange: (value: (typeof SELECT_DATA_OPTIONS)[number]['value']) => void;
};

/**
 * A React functional component that renders a selection interface using a ToggleButtonGroup.
 */
export const SelectData: React.FC<TSelectDataOption> = ({value, onChange}) => {
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
