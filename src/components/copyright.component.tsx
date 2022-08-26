import { Box, Link, Typography } from '@mui/material';

export const Copyright = (props: any) => {
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="body2" color="text.secondary" align="center" {...props}>
        {'Copyright © '}
        <Link color="inherit" href="https://budget-buddy.de">
          Budget-Buddy
        </Link>{' '}
        {new Date().getFullYear()}
      </Typography>
    </Box>
  );
};
