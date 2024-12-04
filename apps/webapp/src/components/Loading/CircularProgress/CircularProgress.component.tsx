import {Box, CircularProgress as MuiCircularProgress} from '@mui/material';

export const CircularProgress = () => {
  return (
    <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}>
      <MuiCircularProgress />
    </Box>
  );
};
