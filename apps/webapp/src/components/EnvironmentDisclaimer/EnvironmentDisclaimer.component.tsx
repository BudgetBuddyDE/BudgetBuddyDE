import {Box, type BoxProps, Typography, type TypographyProps} from '@mui/material';

import {Feature} from '@/app.config';
import {isFeatureEnabled} from '@/components/Feature';

export type TEnvironmentDisclaimerProps = Omit<BoxProps, 'children'> & {
  typogrpahyProps?: TypographyProps;
};

export const EnvironmentDisclaimer: React.FC<TEnvironmentDisclaimerProps> = ({typogrpahyProps, ...boxProps}) => {
  if (!isFeatureEnabled(Feature.ENVIRONMENT_DISCLAIMER)) return null;
  return (
    <Box
      {...boxProps}
      sx={{
        px: 2,
        py: 1,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: 'divider',
        backgroundColor: 'warning.main',
        color: 'warning.contrastText',
        ...boxProps.sx,
      }}>
      <Typography variant="body1" fontWeight={'bolder'} {...typogrpahyProps}>
        This application is in development mode. Connected to{' '}
        {process.env.POCKETBASE_URL || '"POCKETBASE_URL " is missing'}!
      </Typography>
    </Box>
  );
};
