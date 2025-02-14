import {type SxProps, type Theme} from '@mui/material';

export const HideHorizontalScrollbarStyle: SxProps<Theme> = {
  '::-webkit-scrollbar': {
    display: 'none',
  },
  scrollbarWidth: 'none',
};
