import {TuneRounded as TuneIcon} from '@mui/icons-material';
import {Fab} from '@mui/material';

import {useFilterStore} from '@/components/Filter/Filter.store';

export const OpenFilterDrawerFab = () => {
  const {toggleVisibility} = useFilterStore();
  return (
    <Fab color="primary" size="medium" aria-label="open-filter-drawer" onClick={() => toggleVisibility()}>
      <TuneIcon />
    </Fab>
  );
};
