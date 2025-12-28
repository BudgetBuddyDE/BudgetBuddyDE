import {Box, Link, Typography} from '@mui/material';

export const Footer = () => {
  return (
    <Box sx={{py: 3}}>
      <Typography variant="body2" color="text.secondary" align="center">
        {'© '} {new Date().getFullYear()}{' '}
        <Link color="inherit" href="https://budget-buddy.de">
          BudgetBuddyDE
        </Link>{' '}
        {process.env.NEXT_PUBLIC_APP_VERSION}
      </Typography>
    </Box>
  );
};
