import { FC } from 'react';
import { Typography, Box } from '@mui/material';
import { type TRepo } from '../types/repo.type';

export const Repository: FC<{ repo: TRepo }> = ({ repo }) => {
  return (
    <Box
      sx={{
        height: '100%',
        p: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '2px solid',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: (theme) => `${theme.shape.borderRadius}px`,
        transition: '200ms',
        ':hover': {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
        },
      }}
      onClick={() => {
        window.location.href = repo.html_url;
      }}
      data-umami-event="click-project"
      data-umami-event-repository={repo.full_name}
      data-umami-event-link={repo.html_url}
    >
      <Typography
        variant="h6"
        sx={{
          transition: '200ms',
          ':hover': { color: (theme) => theme.palette.primary.main },
        }}
      >
        @{repo.full_name}
      </Typography>
      <Typography>{repo.description || 'No description'}</Typography>
    </Box>
  );
};
