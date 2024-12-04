import {Grid2 as Grid, type Grid2Props as GridProps} from '@mui/material';
import React from 'react';

import {AppConfig} from '@/app.config';

import {PageHeader, type TPageHeaderProps} from '../PageHeader';

export type TContentGrid = React.PropsWithChildren<TPageHeaderProps & GridProps>;

export const ContentGrid: React.FC<TContentGrid> = ({
  title,
  description,
  withNavigateBack,
  navigateBackPath,
  children,
  ...gridProps
}) => {
  return (
    <Grid container spacing={AppConfig.baseSpacing} {...gridProps}>
      <PageHeader
        title={title}
        description={description}
        withNavigateBack={withNavigateBack}
        navigateBackPath={navigateBackPath}
      />
      {children}
    </Grid>
  );
};
