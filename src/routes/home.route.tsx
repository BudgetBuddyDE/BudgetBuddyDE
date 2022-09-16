import { useState, useEffect, MouseEvent } from 'react';
import { Grid, Box, Button, Typography } from '@mui/material';
import { NavbarLinks as pages } from '../constants/navbar-links.constant';
import { TRepo } from '../types/repo.type';
import { Repository } from '../components/repository.component';
import { Image } from '../components/image.component';
import { useScreenSize } from '../hooks/useScreenSize.hook';
import mockup from '../assets/mockup.png';

export const Home = () => {
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<TRepo[]>([]);
  const [rotateXDeg, setXDeg] = useState(10);
  const [rotateYDeg, setYDeg] = useState(-10);

  // FIXME: Don't use any
  function mockupMouseMove(event: any) {
    const multiplier = 25;
    const bodyWidth = document.body.offsetWidth;
    const bodyHeight = document.body.offsetHeight;

    setXDeg(-((event.pageY / bodyHeight) * 2 - 1) * multiplier);
    setYDeg(((event.pageX / bodyWidth) * 2 - 1) * multiplier);
  }

  useEffect(() => {
    fetch('https://api.github.com/orgs/BudgetBuddyDE/repos')
      .then((response) => response.json())
      .then((result: TRepo[]) => setRepos(result))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (screenSize !== 'small') {
      document
        .querySelector('body .mockup-container')
        ?.addEventListener('mousemove', mockupMouseMove);

      return () => {
        document
          .querySelector('body .mockup-container')
          ?.removeEventListener('mousemove', mockupMouseMove);
      };
    }
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ my: { sm: 5 } }}>
          <Box
            className="mockup-container"
            sx={{
              width: '100%',
              perspective: '800px',
            }}
          >
            <Image
              className="mockup"
              sx={{
                width: { xs: '60%', md: '20%' },
                mx: { xs: '20%', md: '40%' },
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotateXDeg}deg) rotateY(${rotateYDeg}deg)`,
              }}
              src={mockup}
              alt="mockup"
            />
          </Box>
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
