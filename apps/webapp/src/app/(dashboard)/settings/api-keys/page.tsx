import {Grid} from '@mui/material';
import {ApiKeyTable} from '@/components/User/ApiKey';

export default function ApiKeysPage() {
  return (
    <Grid container spacing={2}>
      <Grid size={{xs: 12, md: 7}}>
        <ApiKeyTable />
      </Grid>
    </Grid>
  );
}
