import { useState, useEffect } from 'react';
import { Grid, Box, Button, Typography } from '@mui/material';
import { NavbarLinks as pages } from '../constants/navbar-links.constant';
import { TRepo } from '../types/repo.type';
import { Repository } from '../components/repository.component';

export const Home = () => {
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<TRepo[]>([]);

  useEffect(() => {
    fetch('https://api.github.com/orgs/BudgetBuddyDE/repos')
      .then((response) => response.json())
      .then((result: TRepo[]) => setRepos(result))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ my: { sm: 5, md: '10rem' } }}>
          <Typography variant="h1" sx={{ mb: 3, textAlign: 'center' }}>
            Budget-Buddy
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: (theme) => theme.palette.common.white,
                  borderRadius: (theme) => `${Number(theme.shape.borderRadius) * 1.5}px`,
                  mr: 2,
                  ':hover': {
                    backgroundColor: (theme) => theme.palette.common.white,
                  },
                }}
                onClick={() => {
                  window.location.href = page.link;
                }}
              >
                {page.name}
              </Button>
            ))}
          </Box>
        </Box>
      </Grid>

      {!loading && repos.length > 0 && (
        <Grid item xs={12}>
          <Typography variant="h2">Repositories</Typography>

          <Grid container spacing={3} sx={{ mt: 0 }}>
            {repos.map((repo) => (
              <Grid key={repo.id} item xs={12} md={12} lg={6} xl={4}>
                <Repository repo={repo} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};
