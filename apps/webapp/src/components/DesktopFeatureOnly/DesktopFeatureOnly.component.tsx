import {Typography, type TypographyProps} from '@mui/material';
import React from 'react';

import {ActionPaper, type TActionPaperProps} from '../Base/ActionPaper';

export type TDesktopFeatureOnlyProps = TActionPaperProps & {
  typographyProps?: TypographyProps;
};

// TODO: Improve this component by wrapping the children inside this feature and only showing them on desktop
export const DesktopFeatureOnly: React.FC<TDesktopFeatureOnlyProps> = ({typographyProps, ...actionPaperProps}) => {
  return (
    <ActionPaper
      {...actionPaperProps}
      sx={{
        p: 2,
        ...actionPaperProps.sx,
      }}>
      <Typography variant={'h2'} textAlign={'center'} {...typographyProps}>
        This feature is desktop only
      </Typography>
    </ActionPaper>
  );
};
