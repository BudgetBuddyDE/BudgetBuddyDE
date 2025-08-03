'use client';

import React from 'react';
import { type Session } from 'better-auth';
import {
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { NoResults } from '@/components/NoResults';
import { Formatter } from '@/utils/Formatter';
import { authClient, revalidateSession } from '@/authClient';
import { DeleteRounded } from '@mui/icons-material';
import { useSnackbarContext } from '@/components/Snackbar';
import { logger } from '@/logger';

export type SessionListProps = {
  sessions: Session[];
};

export const SessionList: React.FC<SessionListProps> = ({ sessions }) => {
  const { showSnackbar } = useSnackbarContext();
  if (sessions.length == 0) {
    return <NoResults text="No active sessions found." sx={{ mx: 2 }} />;
  }
  const handleRevokeSession = async (token: string) => {
    try {
      const { error } = await authClient.revokeSession({ token: token });
      if (error) throw error;

      await revalidateSession();
      showSnackbar({ message: 'The session was revoked!' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Error revoking session: %s', msg);
      showSnackbar({
        message: msg,
        action: <Button onClick={() => handleRevokeSession(token)}>Retry</Button>,
      });
    }
  };
  return (
    <List disablePadding>
      {sessions.map((session, idx, arr) => {
        const token = session.token;
        const createdAt = Formatter.date.format(session.createdAt);
        const expiresAt = Formatter.date.format(session.expiresAt);
        const userAgent = session.userAgent || 'Unknown User Agent';
        const ipAddress = session.ipAddress || 'Unknown IP Address';
        return (
          <React.Fragment key={session.id}>
            <ListItem
              dense
              secondaryAction={
                <Tooltip title="Revoke session">
                  <IconButton
                    edge="end"
                    aria-label="Revoke session"
                    onClick={() => handleRevokeSession(token)}
                    size="small"
                  >
                    <DeleteRounded />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText
                primary={
                  <React.Fragment>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>IP:</strong> {ipAddress}
                    </Typography>
                    <Tooltip title={userAgent}>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>User Agent:</strong>{' '}
                        {userAgent.length > 32 ? userAgent.substring(0, 32) + '...' : userAgent}
                      </Typography>
                    </Tooltip>
                  </React.Fragment>
                }
                secondary={
                  <Stack flexDirection={'row'}>
                    <Stack flex={1}>
                      <Typography variant="body1" color="text.primary">
                        Created at
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {createdAt}
                      </Typography>
                    </Stack>
                    <Stack flex={1}>
                      <Typography variant="body1" color="text.primary">
                        Expires at
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {expiresAt}
                      </Typography>
                    </Stack>
                  </Stack>
                }
              />
            </ListItem>
            {idx < arr.length - 1 && <Divider component="li" />}
          </React.Fragment>
        );
      })}
    </List>
  );
};
