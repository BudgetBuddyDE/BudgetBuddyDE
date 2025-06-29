import {DeleteRounded} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

import {authClient} from '@/auth';
import {Card} from '@/components/Base/Card';
import {CircularProgress} from '@/components/Loading';
import {useSnackbarContext} from '@/features/Snackbar';
import {use} from '@/hooks/use';
import {Formatter} from '@/services/Formatter';

import {useAuthContext} from '../Auth.context';
import {RevokeSessionsButton} from './RevokeSessionsBtn.component';

export const UserSessions = () => {
  const {showSnackbar} = useSnackbarContext();
  const {revalidateSession} = useAuthContext();
  const {isLoading, result, error} = use(async () => {
    const sessions = (await authClient.listSessions()) ?? [];
    if (sessions.data) {
      return sessions.data;
    } else return [];
  });

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>{error.name}</AlertTitle>
        {error.message}
      </Alert>
    );
  }
  return (
    <Card sx={{px: 0}}>
      <Card.Header sx={{px: 2}}>
        <Stack>
          <Card.Title>User Sessions</Card.Title>
          <Card.Subtitle>Manage your active sessions</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <List disablePadding>
            {result &&
              result.map((session, idx, arr) => {
                const dateFormatter = Formatter.formatDate();
                const createdAt = dateFormatter.format(session.createdAt);
                const expiresAt = dateFormatter.format(session.expiresAt);
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
                            onClick={async () => {
                              try {
                                const {data, error} = await authClient.revokeSession({token: session.token});
                                if (error) {
                                  console.error('Error revoking session:', error);
                                }
                                await revalidateSession();
                                showSnackbar({
                                  message: data?.status
                                    ? 'Session revoked successfully'
                                    : error?.message || 'Failed to revoke session',
                                });
                              } catch (e) {
                                console.error('Error revoking session:', e);
                                showSnackbar({message: 'Unexpected error occurred while revoking session'});
                              }
                            }}
                            size="small">
                            <DeleteRounded />
                          </IconButton>
                        </Tooltip>
                      }>
                      <ListItemText
                        primary={
                          <>
                            <Typography variant="body2" sx={{mt: 1}}>
                              <strong>IP:</strong> {ipAddress}
                            </Typography>
                            <Tooltip title={userAgent}>
                              <Typography variant="body2" sx={{mt: 0.5}}>
                                <strong>User Agent:</strong>{' '}
                                {userAgent.length > 32 ? userAgent.substring(0, 32) + '...' : userAgent}
                              </Typography>
                            </Tooltip>
                          </>
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
        )}
      </Card.Body>
      <Card.Footer sx={{px: 2, display: 'flex', justifyContent: 'flex-end'}}>
        {!isLoading && <RevokeSessionsButton />}
      </Card.Footer>
    </Card>
  );
};
