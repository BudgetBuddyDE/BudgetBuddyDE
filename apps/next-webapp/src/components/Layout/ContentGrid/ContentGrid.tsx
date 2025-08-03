import { Grid, type GridProps } from '@mui/material';
import React from 'react';
import { PageHeader, TPageHeaderProps } from '../PageHeader';

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
    <Grid container spacing={2} {...gridProps}>
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
