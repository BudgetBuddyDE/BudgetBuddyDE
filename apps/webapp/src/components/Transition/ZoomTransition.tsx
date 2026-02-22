'use client';

import {Zoom} from '@mui/material';
import type {TransitionProps} from '@mui/material/transitions';
import React from 'react';

/**
 *
 * @documentation https://mui.com/material-ui/transitions/#zoom
 */
export const ZoomTransition = React.forwardRef(
  (
    props: TransitionProps & {
      // biome-ignore lint/suspicious/noExplicitAny: Could not find a better type
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
  ) => {
    return <Zoom in={true} ref={ref} {...props} />;
  },
);
