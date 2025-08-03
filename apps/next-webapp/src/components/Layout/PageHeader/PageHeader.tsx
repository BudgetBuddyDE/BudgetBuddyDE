import { Grid, type GridProps, Stack, Typography } from '@mui/material';
import React from 'react';
import { GoBack } from './GoBack';

export type TPageHeaderProps = {
  title: string;
  description?: string;
  withNavigateBack?: boolean;
  navigateBackPath?: string;
} & GridProps;

export const PageHeader: React.FC<TPageHeaderProps> = ({
  title,
  description,
  withNavigateBack = false,
  navigateBackPath,
  ...gridProps
}) => {
  return (
    <Grid size={{ xs: 12 }} {...gridProps}>
      <Stack flexDirection={'row'} columnGap={2}>
        {withNavigateBack && (
          <GoBack
            withNavigation
            navigationPath={navigateBackPath}
            big={title != undefined && description != undefined}
          />
        )}
        <Stack>
          <Typography variant="h5" fontWeight="bold" sx={{ m: 0 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="h6" fontWeight="bold" sx={{ m: 0 }}>
              {description}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Grid>
  );
};
