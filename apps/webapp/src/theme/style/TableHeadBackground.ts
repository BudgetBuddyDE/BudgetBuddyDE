import type {Theme} from '@mui/material/styles';

/**
 * Matches the sticky table header to the surrounding Paper at elevation 3.
 */
export const tableHeadBackground = (theme: Theme) => ({
  backgroundColor: theme.vars?.palette.background.paper ?? theme.palette.background.paper,
  backgroundImage: theme.vars?.overlays[3],
});
