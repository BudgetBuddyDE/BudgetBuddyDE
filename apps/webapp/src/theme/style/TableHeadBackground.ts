import type {Theme} from '@mui/material/styles';
import {lighten} from '@mui/material/styles';

/**
 * Background color used for sticky table headers.
 * Shared by the BasicTable and EntityTable components.
 */
export const tableHeadBackground = (theme: Theme) => lighten(theme.palette.background.paper, 0.0825);
