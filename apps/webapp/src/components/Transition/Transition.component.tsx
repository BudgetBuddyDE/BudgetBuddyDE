import Slide from '@mui/material/Slide';
import {type TransitionProps} from '@mui/material/transitions';
import React from 'react';

export const Transition = React.forwardRef(
  (
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
  ) => {
    return <Slide direction="up" ref={ref} {...props} />;
  },
);
