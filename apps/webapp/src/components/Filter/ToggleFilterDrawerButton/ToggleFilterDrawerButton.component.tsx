import {TuneRounded} from '@mui/icons-material';
import {IconButton, Tooltip} from '@mui/material';

import {useFilterStore} from '../Filter.store.ts';

export const ToggleFilterDrawerButton = () => {
  const {toggleVisibility} = useFilterStore();
  return (
    <Tooltip title="Open filters">
      <IconButton aria-label="apply-filters" color="primary" onClick={() => toggleVisibility()}>
        <TuneRounded fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
};
