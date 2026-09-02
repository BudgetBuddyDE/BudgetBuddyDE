import {Box, Link, Typography} from '@mui/material';
import {webappConfig} from '@/config';

export const Footer = () => {
  return (
    <Box sx={{py: 3}}>
      <Typography
        variant="body2"
        align="center"
        sx={{
          color: 'text.secondary',
        }}
      >
        {'© '} {new Date().getFullYear()}{' '}
        <Link color="inherit" href="https://budget-buddy.de">
          BudgetBuddyDE
        </Link>{' '}
        {webappConfig.version}
      </Typography>
    </Box>
  );
};
