import {Grid} from '@mui/material';
import {AppInformation} from '@/components/Settings/AppInformation';
import {EditUser} from '@/components/User/EditUser';
import {UserAccounts} from '@/components/User/UserAccounts';
import {UserSessions} from '@/components/User/UserSessions';

export default function SettingsProfilePage() {
  return (
    <Grid container spacing={2}>
      <Grid container size={{xs: 12, md: 3.5}} spacing={2}>
        <Grid size={{xs: 12}}>
          <AppInformation />
        </Grid>
      </Grid>

      <Grid container size={{xs: 12, md: 5}}>
        <Grid size={{xs: 12}}>
          <EditUser />
        </Grid>
      </Grid>

      <Grid container size={{xs: 12, md: 3.5}} spacing={2}>
        <Grid size={{xs: 12}}>
          <UserAccounts />
        </Grid>

        <Grid size={{xs: 12}}>
          <UserSessions />
        </Grid>
      </Grid>
    </Grid>
  );
}
