import type {MixinsOptions} from '@mui/material/styles';

export const mixins: MixinsOptions = {
  toolbar: {
    minHeight: 56,
    '@media (min-width:0px)': {
      '@media (orientation: landscape)': {
        minHeight: 48,
      },
    },
    '@media (min-width:600px)': {
      minHeight: 64,
    },
  },
};
