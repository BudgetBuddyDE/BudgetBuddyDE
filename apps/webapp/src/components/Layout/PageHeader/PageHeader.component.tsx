import {ArrowBackRounded} from '@mui/icons-material';
import {Grid2 as Grid, type Grid2Props as GridProps, IconButton, Stack, Typography} from '@mui/material';
import React from 'react';
import {Link, useNavigate} from 'react-router-dom';

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
  const navigate = useNavigate();
  return (
    <Grid size={{xs: 12}} {...gridProps}>
      <Stack flexDirection={'row'} columnGap={2}>
        {withNavigateBack && (
          <IconButton
            size="large"
            color="primary"
            // component={Link}
            // to={"navigationPath"}
            {...(withNavigateBack && {
              component: Link,
              ...(navigateBackPath
                ? {to: navigateBackPath}
                : window.history.length > 0
                  ? {
                      onClick: () => {
                        navigate(-1 as any, {replace: true});
                      },
                    }
                  : {to: '/stocks'}),
            })}
            sx={{
              aspectRatio: '1/1',
              width: 'auto',
              height: title && description ? '4rem' : '2rem',
            }}>
            <ArrowBackRounded />
          </IconButton>
        )}
        <Stack>
          <Typography variant="h5" fontWeight="bold" sx={{m: 0}}>
            {title}
          </Typography>
          {description && (
            <Typography variant="h6" fontWeight="bold" sx={{m: 0}}>
              {description}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Grid>
  );
};
