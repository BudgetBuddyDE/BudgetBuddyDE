import { headers } from 'next/headers';
import { Stack } from '@mui/material';
import React from 'react';

import { Card } from '@/components/Card';

import { RevokeSessionsButton } from './RevokeSessionsBtn';
import { authClient } from '@/authClient';
import { SessionList } from './SessionList';

export const UserSessions = async () => {
  const { data, error } = await authClient.listSessions({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (error) throw error;
  return (
    <Card sx={{ px: 0 }}>
      <Card.Header sx={{ px: 2 }}>
        <Stack>
          <Card.Title>User Sessions</Card.Title>
          <Card.Subtitle>Manage your active sessions</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        <SessionList sessions={data} />
      </Card.Body>
      <Card.Footer sx={{ px: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <RevokeSessionsButton />
      </Card.Footer>
    </Card>
  );
};
