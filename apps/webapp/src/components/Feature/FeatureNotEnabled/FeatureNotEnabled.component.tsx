import {LockRounded, RefreshRounded} from '@mui/icons-material';
import {Button, type PaperProps, Typography} from '@mui/material';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {DashboardViewIconMapping} from '@/routes/Dashboard';

import {Icon} from '../../Icon/Icon.component';

export type TFeatureNotEnabledProps = PaperProps;

export const FeatureNotEnabled: React.FC<TFeatureNotEnabledProps> = ({...paperProps}) => {
  return (
    <ActionPaper
      {...paperProps}
      sx={{
        width: {xs: '90%', md: '40%', lg: '35%'},
        maxWidth: '480px',
        margin: 'auto',
        px: 3,
        py: 2,
        textAlign: 'center',
        ...paperProps.sx,
      }}>
      <Icon icon={<LockRounded fontSize="large" />} sx={{width: '58px', mx: 'auto'}} />
      <Typography variant="h2" sx={{mt: 1.5}}>
        Feature disabled
      </Typography>
      <Typography sx={{my: 1}}>Sorry, this feature is currently not available.</Typography>
      <Button variant="contained" color="primary" href="/dashboard" startIcon={DashboardViewIconMapping['overview']}>
        Go to Dashboard
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<RefreshRounded />}
        onClick={() => window.location.reload()}
        sx={{ml: 2}}>
        Refresh
      </Button>
    </ActionPaper>
  );
};
